"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MANILA_CENTER: [number, number] = [121.0, 14.6];

type SearchResult = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

/**
 * Address text geocoding routinely picks the wrong match -- Metro Manila has
 * several identically-named streets (two "9th Avenue"s in Taguig alone), so
 * blindly taking the first result silently lands a listing kilometres away.
 * This lets the owner pick the right match from a list, paste exact
 * coordinates from Google Maps, or drag the pin. Any of those overrides the
 * auto-geocoded value.
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
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [position.lng, position.lat],
      zoom: lat != null && lng != null ? 15 : 11,
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

    // Clicking the map is a far easier target than dragging a small pin.
    map.on("click", (event) => {
      const { lat: clickedLat, lng: clickedLng } = event.lngLat;
      marker.setLngLat([clickedLng, clickedLat]);
      setPosition({ lat: clickedLat, lng: clickedLng });
      setMoved(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map is created once per mount
  }, [token]);

  function applyPosition(nextLat: number, nextLng: number, zoom = 17) {
    setPosition({ lat: nextLat, lng: nextLng });
    setMoved(true);
    markerRef.current?.setLngLat([nextLng, nextLat]);
    mapRef.current?.flyTo({ center: [nextLng, nextLat], zoom });
  }

  async function handleSearch() {
    if (!token || !search.trim()) return;
    setSearching(true);
    setSearchError(null);
    setResults([]);

    try {
      const url = new URL(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(search)}.json`
      );
      url.searchParams.set("access_token", token);
      url.searchParams.set("country", "PH");
      url.searchParams.set("limit", "5");
      url.searchParams.set("proximity", `${position.lng},${position.lat}`);

      const response = await fetch(url);
      const data = await response.json();
      const features = Array.isArray(data.features) ? data.features : [];

      const parsed: SearchResult[] = features
        .filter(
          (feature: { center?: unknown }) =>
            Array.isArray(feature.center) && feature.center.length === 2
        )
        .map((feature: { id: string; place_name: string; center: [number, number] }) => ({
          id: feature.id,
          label: feature.place_name,
          lat: feature.center[1],
          lng: feature.center[0],
        }));

      if (parsed.length === 0) {
        setSearchError(
          "No matches found. Try just the mall or building name, or paste coordinates below."
        );
        return;
      }

      setResults(parsed);
    } catch {
      setSearchError("Search failed. Paste coordinates below instead.");
    } finally {
      setSearching(false);
    }
  }

  function handlePaste() {
    setPasteError(null);
    const match = paste.trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (!match) {
      setPasteError("Paste as: latitude, longitude — e.g. 14.556500, 121.048000");
      return;
    }

    const nextLat = Number(match[1]);
    const nextLng = Number(match[2]);
    if (nextLat < -90 || nextLat > 90 || nextLng < -180 || nextLng > 180) {
      setPasteError("Those numbers aren't a valid latitude/longitude.");
      return;
    }

    applyPosition(nextLat, nextLng);
    setPaste("");
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
        This is what shows on the Explore Map and powers &quot;Get
        Directions.&quot; Search and pick the right match, click anywhere on
        the map to move the pin, or paste exact coordinates.
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

      {results.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-black/10">
          <p className="bg-navey-band/50 px-3 py-2 text-xs font-semibold">
            Pick the correct match:
          </p>
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => {
                applyPosition(result.lat, result.lng);
                setResults([]);
              }}
              className="block w-full border-t border-black/5 px-3 py-2 text-left text-xs hover:bg-navey-band/40"
            >
              {result.label}
            </button>
          ))}
        </div>
      )}

      <div ref={containerRef} className="h-64 w-full rounded-2xl" />

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

      <details className="mt-1">
        <summary className="cursor-pointer text-xs font-semibold text-navey-ink/70">
          Paste exact coordinates from Google Maps
        </summary>
        <p className="mt-2 text-xs text-navey-ink/50">
          In Google Maps, right-click the exact spot and click the
          latitude/longitude at the top of the menu to copy it, then paste it
          here.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={paste}
            onChange={(event) => setPaste(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handlePaste();
              }
            }}
            placeholder="14.556500, 121.048000"
            className="flex-1 rounded-full border border-black/10 px-4 py-2 text-sm outline-none focus:border-navey-ink"
          />
          <button
            type="button"
            onClick={handlePaste}
            className="rounded-full bg-navey-band px-4 py-2 text-sm font-bold hover:bg-navey-band/80"
          >
            Use
          </button>
        </div>
        {pasteError && <p className="mt-1 text-xs text-red-600">{pasteError}</p>}
      </details>

      <input type="hidden" name="lat" value={position.lat} />
      <input type="hidden" name="lng" value={position.lng} />
      <input type="hidden" name="locationAdjusted" value={moved ? "true" : "false"} />
    </div>
  );
}
