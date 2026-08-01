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
  /** True only for an actual business. A street result's "title" is the street
   *  name, which must never be offered as a shop name. */
  isBusiness: boolean;
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
  place_type?: string[];
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
    isBusiness: feature.place_type?.includes("poi") ?? false,
    detail: placeName,
    addressLine,
    city,
    province,
    lat: feature.center[1],
    lng: feature.center[0],
  };
}

type MapboxV6Feature = {
  id?: string;
  properties?: {
    mapbox_id?: string;
    feature_type?: string;
    name?: string;
    full_address?: string;
    place_formatted?: string;
    coordinates?: { longitude?: number; latitude?: number };
    context?: {
      place?: { name?: string };
      locality?: { name?: string };
      district?: { name?: string };
      region?: { name?: string };
      country?: { name?: string };
    };
  };
  geometry?: { coordinates?: [number, number] };
};

function toSuggestionV6(feature: MapboxV6Feature): Suggestion | null {
  const props = feature.properties;
  const lng = props?.coordinates?.longitude ?? feature.geometry?.coordinates?.[0];
  const lat = props?.coordinates?.latitude ?? feature.geometry?.coordinates?.[1];
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  const context = props?.context ?? {};
  const city =
    context.place?.name ?? context.locality?.name ?? context.district?.name ?? "";
  const province = context.region?.name ?? "";
  const country = context.country?.name ?? "";

  const full = props?.full_address ?? props?.name ?? "";
  const addressLine =
    full
      .split(", ")
      .filter((part) => part !== city && part !== province && part !== country)
      .join(", ") || (props?.name ?? "");

  return {
    id: props?.mapbox_id ?? feature.id ?? `${lat},${lng}`,
    title: props?.name ?? addressLine,
    isBusiness: props?.feature_type === "poi",
    detail: full || props?.place_formatted || addressLine,
    addressLine,
    city,
    province,
    lat,
    lng,
  };
}

/** Returns null when the request itself failed, so a broken key or network
 *  error can be reported differently from a genuine zero-result search. */
async function fetchV5(
  variant: string,
  token: string,
  near: { lat: number; lng: number } | null
): Promise<Suggestion[] | null> {
  try {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(variant)}.json`
    );
    url.searchParams.set("access_token", token);
    url.searchParams.set("country", "PH");
    url.searchParams.set("autocomplete", "true");
    url.searchParams.set("limit", "6");
    url.searchParams.set("types", "poi,address,place,locality,neighborhood");
    if (near) url.searchParams.set("proximity", `${near.lng},${near.lat}`);

    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const features: MapboxFeature[] = Array.isArray(data.features) ? data.features : [];
    return features
      .map(toSuggestion)
      .filter((entry): entry is Suggestion => entry !== null);
  } catch {
    return null;
  }
}

/** v6 is queried alongside v5 because v5 has no `street` type -- its
 *  `address` type needs a house number, so a bare street never matches. */
async function fetchV6(
  variant: string,
  token: string,
  near: { lat: number; lng: number } | null
): Promise<Suggestion[] | null> {
  try {
    const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
    url.searchParams.set("q", variant);
    url.searchParams.set("access_token", token);
    url.searchParams.set("country", "ph");
    url.searchParams.set("autocomplete", "true");
    url.searchParams.set("limit", "6");
    url.searchParams.set("types", "street,address,place,locality,neighborhood,district");
    if (near) url.searchParams.set("proximity", `${near.lng},${near.lat}`);

    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const features: MapboxV6Feature[] = Array.isArray(data.features) ? data.features : [];
    return features
      .map(toSuggestionV6)
      .filter((entry): entry is Suggestion => entry !== null);
  } catch {
    return null;
  }
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
  onPick,
}: {
  initialAddress?: string;
  initialCity?: string;
  initialProvince?: string;
  initialLat?: number | null;
  initialLng?: number | null;
  /**
   * The search already knows what the business is called -- picking a shop
   * hands back its name along with the address. Passing it up lets the form
   * fill the name field instead of asking for something we were told.
   */
  onPick?: (picked: { name: string; city: string; province: string }) => void;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const typingRef = useRef(false);
  // A pasted address is already the answer -- the person is not browsing
  // options, they are handing us one. Remembered so the first result can be
  // applied without making them tap a dropdown they did not ask for.
  const pastedRef = useRef(false);
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
  const positionRef = useRef(position);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [noMatches, setNoMatches] = useState(false);
  const [searchBroken, setSearchBroken] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // choose() is redefined each render; holding it in a ref lets the search
  // effect call the current one without listing it as a dependency.
  const chooseRef = useRef<(suggestion: Suggestion) => void>(() => {});
  useEffect(() => {
    chooseRef.current = choose;
  });

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
        let anyRequestSucceeded = false;

        for (const variant of queryVariants(term)) {
          const [v5, v6] = await Promise.all([
            fetchV5(variant, token, positionRef.current),
            fetchV6(variant, token, positionRef.current),
          ]);

          if (v5 !== null || v6 !== null) anyRequestSucceeded = true;

          // v5 first: business names are the most specific match when they
          // exist. v6 supplies streets, which v5 has no type for at all.
          const merged = [...(v5 ?? []), ...(v6 ?? [])];
          const seen = new Set<string>();
          parsed = merged.filter((entry) => {
            const key = `${entry.lat.toFixed(5)},${entry.lng.toFixed(5)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }).slice(0, 6);

          if (parsed.length > 0) break;
        }

        if (pastedRef.current) {
          pastedRef.current = false;
          if (parsed.length > 0) {
            // choose() clears typingRef, so the address it writes back does
            // not start this search over.
            chooseRef.current(parsed[0]);
            return;
          }
        }

        setSuggestions(parsed);
        setOpen(parsed.length > 0);
        setNoMatches(parsed.length === 0 && anyRequestSucceeded);
        setSearchBroken(!anyRequestSucceeded);
      } catch {
        setSuggestions([]);
        setSearchBroken(true);
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
      // The map sits inside a form. Without this it swallows page scroll and
      // one-finger drags, so scrolling past it pans the map instead of the
      // page -- which makes the whole form feel stuck on a phone.
      cooperativeGestures: true,
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

  /** Single place that moves the pin, whatever set it: a suggestion, the
   *  device's own location, or a tap on the map. */
  function applyPosition(lat: number, lng: number, zoom = 16) {
    setPosition({ lat, lng });
    setPinSet(true);

    const map = mapRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    } else {
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
    map.flyTo({ center: [lng, lat], zoom });
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocateError("This browser can't share your location.");
      return;
    }
    setLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (result) => {
        applyPosition(result.coords.latitude, result.coords.longitude, 17);
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        setLocateError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was blocked. Allow it in your browser settings, or tap the map instead."
            : "Couldn't get your location. Tap the map instead."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function choose(suggestion: Suggestion) {
    typingRef.current = false;
    setAddress(suggestion.addressLine);
    if (suggestion.city) setCity(suggestion.city);
    if (suggestion.province) setProvince(suggestion.province);
    setSuggestions([]);
    setOpen(false);
    setNoMatches(false);
    applyPosition(suggestion.lat, suggestion.lng, 16);
    onPick?.({
      // Only a real business has a usable name; a street result would put
      // "9th Avenue" in the shop-name box.
      name: suggestion.isBusiness ? suggestion.title : "",
      city: suggestion.city,
      province: suggestion.province,
    });
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
            onPaste={() => {
              pastedRef.current = true;
            }}
            onChange={(event) => {
              typingRef.current = true;
              setNoMatches(false);
              setSearchBroken(false);
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
            <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-2xl border border-black/10 bg-white py-1 shadow-[0_16px_32px_rgba(20,18,11,0.16)]">
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
            (noMatches || searchBroken) && !loading
              ? "text-amber-700"
              : "text-navey-ink/50"
          }`}
        >
          {loading
            ? "Looking up addresses…"
            : searchBroken
              ? "Address search is unavailable right now — tap the map below to drop the pin instead."
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Pin on the map</p>
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="rounded-full bg-navey-band px-4 py-2 text-xs font-bold hover:bg-navey-band/70 disabled:opacity-60"
          >
            {locating ? "Finding you…" : "📍 Use my current location"}
          </button>
        </div>
        <div ref={containerRef} className="h-64 w-full rounded-2xl" />
        {locateError && <p className="text-xs text-amber-700">{locateError}</p>}
        <p className="text-xs text-navey-ink/50">
          {position
            ? "Not exactly right? Tap the map or drag the pin to move it."
            : "Tap the map where your spot is — or use the button above if you're there now."}
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
