"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MANILA_CENTER: [number, number] = [121.0, 14.6];

/**
 * Philippine addresses are commonly written as intersections -- "7th Ave
 * corner 25th St" -- which geocoders don't parse, returning nothing at all.
 * Try the raw text first, then progressively simpler forms: "corner"
 * rewritten as a separator, and finally just the first street plus the
 * city/province tail.
 */
function queryVariants(term: string): string[] {
  const variants = [term];

  const decornered = term
    .replace(/\s*\b(?:cor\.?|corner)\b\s*/gi, ", ")
    .replace(/\s*,\s*,+/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
  if (decornered !== term) variants.push(decornered);

  const parts = decornered.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length > 2) {
    // Drop the second street, keep the first plus everything after it.
    variants.push([parts[0], ...parts.slice(2)].join(", "));
  }

  return [...new Set(variants)];
}

type Suggestion = {
  id: string;
  title: string;
  detail: string;
  addressLine: string;
  city: string;
  province: string;
  lat: number;
  lng: number;
};

type MapboxContext = { id: string; text: string };
type MapboxFeature = {
  id: string;
  text?: string;
  place_name?: string;
  center: [number, number];
  context?: MapboxContext[];
};

function toSuggestion(feature: MapboxFeature): Suggestion | null {
  if (!Array.isArray(feature.center) || feature.center.length !== 2) return null;

  const context = feature.context ?? [];
  const find = (prefix: string) =>
    context.find((entry) => entry.id?.startsWith(`${prefix}.`))?.text ?? "";

  const city = find("place") || find("locality") || find("district");
  const province = find("region");
  const country = find("country");

  const placeName = feature.place_name ?? feature.text ?? "";
  // Strip the city/province/country tail so the address line stays the
  // street-level part -- the city and province get their own fields.
  const addressLine =
    placeName
      .split(", ")
      .filter((part) => part !== city && part !== province && part !== country)
      .join(", ") || placeName;

  return {
    id: feature.id,
    title: feature.text ?? addressLine,
    detail: placeName,
    addressLine,
    city,
    province,
    lat: feature.center[1],
    lng: feature.center[0],
  };
}

/**
 * Airbnb-style location entry: the person types their address, picks a real
 * place from the dropdown, and the city, province and map pin all fill
 * themselves in. Metro Manila has several identically-named streets, so
 * picking a specific suggestion -- rather than letting the server guess from
 * free text -- is what keeps a listing off the wrong "9th Avenue".
 */
export function LocationFields({
  initialAddress = "",
  initialCity = "",
  initialProvince = "",
  initialLat = null,
  initialLng = null,
}: {
  initialAddress?: string;
  initialCity?: string;
  initialProvince?: string;
  initialLat?: number | null;
  initialLng?: number | null;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const typingRef = useRef(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [address, setAddress] = useState(initialAddress);
  const [city, setCity] = useState(initialCity);
  const [province, setProvince] = useState(initialProvince);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialLat != null && initialLng != null
      ? { lat: initialLat, lng: initialLng }
      : null
  );
  const [pinSet, setPinSet] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [noMatches, setNoMatches] = useState(false);

  // Debounced lookup as the person types, so suggestions appear on their own.
  useEffect(() => {
    if (!token || !typingRef.current) return;
    const term = address.trim();

    const timer = setTimeout(async () => {
      if (term.length < 3) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        let parsed: Suggestion[] = [];

        for (const variant of queryVariants(term)) {
          const url = new URL(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(variant)}.json`
          );
          url.searchParams.set("access_token", token);
          url.searchParams.set("country", "PH");
          url.searchParams.set("autocomplete", "true");
          url.searchParams.set("limit", "6");
          url.searchParams.set(
            "types",
            "poi,address,place,locality,neighborhood"
          );

          const response = await fetch(url);
          const data = await response.json();
          const features: MapboxFeature[] = Array.isArray(data.features)
            ? data.features
            : [];

          parsed = features
            .map(toSuggestion)
            .filter((entry): entry is Suggestion => entry !== null);

          if (parsed.length > 0) break;
        }

        setSuggestions(parsed);
        setOpen(parsed.length > 0);
        setNoMatches(parsed.length === 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [address, token]);

  // The map is always mounted, even before a location is chosen: when a
  // search finds nothing, tapping the map is the only way to place the pin.
  useEffect(() => {
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialLat != null && initialLng != null
        ? [initialLng, initialLat]
        : MANILA_CENTER,
      zoom: initialLat != null && initialLng != null ? 16 : 10,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    function placeMarker(lat: number, lng: number) {
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
        return;
      }
      const marker = new mapboxgl.Marker({ draggable: true, color: "#14120B" })
        .setLngLat([lng, lat])
        .addTo(map);
      marker.on("dragend", () => {
        const next = marker.getLngLat();
        setPosition({ lat: next.lat, lng: next.lng });
        setPinSet(true);
      });
      markerRef.current = marker;
    }

    if (initialLat != null && initialLng != null) {
      placeMarker(initialLat, initialLng);
    }

    map.on("click", (event) => {
      placeMarker(event.lngLat.lat, event.lngLat.lng);
      setPosition({ lat: event.lngLat.lat, lng: event.lngLat.lng });
      setPinSet(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Built once on mount; later selections move the existing map via flyTo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function choose(suggestion: Suggestion) {
    typingRef.current = false;
    setAddress(suggestion.addressLine);
    if (suggestion.city) setCity(suggestion.city);
    if (suggestion.province) setProvince(suggestion.province);
    setPosition({ lat: suggestion.lat, lng: suggestion.lng });
    setPinSet(true);
    setSuggestions([]);
    setOpen(false);
    setNoMatches(false);

    const map = mapRef.current;
    if (map) {
      if (markerRef.current) {
        markerRef.current.setLngLat([suggestion.lng, suggestion.lat]);
      } else {
        const marker = new mapboxgl.Marker({ draggable: true, color: "#14120B" })
          .setLngLat([suggestion.lng, suggestion.lat])
          .addTo(map);
        marker.on("dragend", () => {
          const next = marker.getLngLat();
          setPosition({ lat: next.lat, lng: next.lng });
          setPinSet(true);
        });
        markerRef.current = marker;
      }
      map.flyTo({ center: [suggestion.lng, suggestion.lat], zoom: 16 });
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <label htmlFor="address" className="text-sm font-semibold">
          Address
        </label>
        <div className="relative">
          <input
            id="address"
            name="address"
            type="text"
            value={address}
            required
            autoComplete="off"
            placeholder="Start typing the shop's address or name..."
            onChange={(event) => {
              typingRef.current = true;
              setNoMatches(false);
              setAddress(event.target.value);
            }}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onBlur={() => {
              // Delay so a tap on a suggestion still registers.
              blurTimerRef.current = setTimeout(() => setOpen(false), 150);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && open) event.preventDefault();
              if (event.key === "Escape") setOpen(false);
            }}
            className="w-full rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
          />
          {open && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-2xl border border-black/10 bg-white py-1 shadow-[0_16px_32px_rgba(20,18,11,0.16)]">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    onMouseDown={() => {
                      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
                    }}
                    onClick={() => choose(suggestion)}
                    className="block w-full px-4 py-2.5 text-left hover:bg-navey-band/50"
                  >
                    <span className="block text-sm font-semibold">
                      {suggestion.title}
                    </span>
                    <span className="block text-xs text-navey-ink/55">
                      {suggestion.detail}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p
          className={`text-xs ${
            noMatches && !loading ? "text-amber-700" : "text-navey-ink/50"
          }`}
        >
          {loading
            ? "Looking up addresses…"
            : noMatches
              ? "No match found — try a nearby landmark or mall name, or just tap the map below to drop the pin."
              : "Pick your shop from the list so we can put it on the map correctly."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="city" className="text-sm font-semibold">
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            required
            className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="province" className="text-sm font-semibold">
            Province (optional)
          </label>
          <input
            id="province"
            name="province"
            type="text"
            value={province}
            onChange={(event) => setProvince(event.target.value)}
            className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div ref={containerRef} className="h-56 w-full rounded-2xl" />
        <p className="text-xs text-navey-ink/50">
          {position
            ? "Not exactly right? Tap the map or drag the pin to move it."
            : "Tap the map to drop the pin on your spot."}
        </p>
      </div>

      <input type="hidden" name="lat" value={position?.lat ?? ""} />
      <input type="hidden" name="lng" value={position?.lng ?? ""} />
      <input
        type="hidden"
        name="locationAdjusted"
        value={pinSet && position ? "true" : "false"}
      />
    </>
  );
}
