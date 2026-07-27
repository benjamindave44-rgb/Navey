"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MANILA_CENTER: [number, number] = [121.0, 14.6];

/**
 * Address text geocoding is rarely pinpoint-accurate for a specific unit
 * inside a mall or building, so this lets the owner search their way to the
 * right neighborhood and then drag the pin onto the exact spot. A manual
 * drag or search always overrides the auto-geocoded coordinates.
 */
export function LocationPicker({
  lat,
  lng,
  searchHint,
}: {
  lat: number | null;
  lng: number | null;
  searchHint?: string;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [position, setPosition] = useState({
    lat: lat ?? MANILA_CENTER[1],
    lng: lng ?? MANILA_CENTER[0],
  });
  const [moved, setMoved] = useState(false);
  const [search, setSearch] = useState(searchHint ?? "");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [position.lng, position.lat],
      zoom: lat != null && lng != null ? 14 : 11,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    const marker = new mapboxgl.Marker({ draggable: true, color: "#14120B" })
      .setLngLat([position.lng, position.lat])
      .addTo(map);
    markerRef.current = marker;

    marker.on("dragend", () => {
      const next = marker.getLngLat();
      setPosition({ lat: next.lat, lng: next.lng });
      setMoved(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map is created once per mount
  }, [token]);

  async function handleSearch() {
    if (!token || !search.trim() || !mapRef.current || !markerRef.current) return;
    setSearching(true);
    setSearchError(null);

    try {
      const url = new URL(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(search)}.json`
      );
      url.searchParams.set("access_token", token);
      url.searchParams.set("country", "PH");
      url.searchParams.set("limit", "1");

      const response = await fetch(url);
      const data = await response.json();
      const center = data.features?.[0]?.center;

      if (!Array.isArray(center) || center.length !== 2) {
        setSearchError("Couldn't find that place. Try a simpler search, or drag the pin manually.");
        return;
      }

      const [lng, foundLat] = center;
      setPosition({ lat: foundLat, lng });
      setMoved(true);
      mapRef.current.flyTo({ center: [lng, foundLat], zoom: 16 });
      markerRef.current.setLngLat([lng, foundLat]);
    } catch {
      setSearchError("Search failed. Try again, or drag the pin manually.");
    } finally {
      setSearching(false);
    }
  }

  if (!token) {
    return (
      <>
        <input type="hidden" name="lat" value={lat ?? ""} />
        <input type="hidden" name="lng" value={lng ?? ""} />
        <input type="hidden" name="locationAdjusted" value="false" />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">Pin location</p>
      <p className="text-xs text-navey-ink/50">
        Search a landmark to jump to the right area, then click and hold
        directly on the black pin and drag it onto the exact building
        (dragging anywhere else just pans the map). This is what shows on the
        Explore Map and powers &quot;Get Directions.&quot;
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSearch();
            }
          }}
          placeholder="Search a landmark or address..."
          className="flex-1 rounded-full border border-black/10 px-4 py-2 text-sm outline-none focus:border-navey-ink"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="rounded-full bg-navey-band px-4 py-2 text-sm font-bold hover:bg-navey-band/80 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {searching ? "Searching…" : "Find"}
        </button>
      </div>
      {searchError && <p className="text-xs text-red-600">{searchError}</p>}
      <div ref={containerRef} className="h-56 w-full rounded-2xl" />
      <p className="text-xs text-navey-ink/50">
        Pin coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
      </p>
      {moved ? (
        <p className="text-xs font-semibold text-green-700">
          ✓ Pin moved — click &quot;Save Overview&quot; below to keep it.
        </p>
      ) : (
        <p className="text-xs text-navey-ink/40">
          Pin hasn&apos;t been moved yet — this is still the original location.
        </p>
      )}
      <input type="hidden" name="lat" value={position.lat} />
      <input type="hidden" name="lng" value={position.lng} />
      <input type="hidden" name="locationAdjusted" value={moved ? "true" : "false"} />
    </div>
  );
}
