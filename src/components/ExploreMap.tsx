"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapSpot } from "@/lib/queries";
import { SPOT_CATEGORIES, UNKNOWN_CATEGORY_COLOR } from "@/lib/categories";

const MANILA_CENTER: [number, number] = [121.0, 14.6];

/** One source, clustered, feeding all three layers below. */
const SOURCE = "spots";

function buildPopupElement(spot: MapSpot) {
  const wrapper = document.createElement("div");
  wrapper.style.minWidth = "160px";

  if (spot.coverPhoto) {
    const img = document.createElement("img");
    img.src = spot.coverPhoto;
    img.alt = "";
    img.style.cssText =
      "width:100%;height:80px;object-fit:cover;border-radius:8px;margin-bottom:6px";
    wrapper.appendChild(img);
  }

  const name = document.createElement("p");
  name.style.cssText = "font-weight:700;margin:0 0 2px;font-size:13px";
  name.textContent = spot.name;
  wrapper.appendChild(name);

  const meta = document.createElement("p");
  meta.style.cssText = "font-size:12px;color:#666;margin:0 0 6px";
  meta.textContent = spot.priceRange ? `${spot.city} · ${spot.priceRange}` : spot.city;
  wrapper.appendChild(meta);

  const link = document.createElement("a");
  link.href = `/spots/${spot.id}`;
  link.style.cssText = "font-size:12px;font-weight:700;text-decoration:underline";
  link.textContent = "View spot →";
  wrapper.appendChild(link);

  return wrapper;
}

export function ExploreMap({
  spots,
  token,
}: {
  spots: MapSpot[];
  token: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const meRef = useRef<mapboxgl.Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  /**
   * "What is good around here" is the question someone standing on a street
   * actually has, and the coordinates to answer it were already on every
   * listing -- there was just no way to ask.
   *
   * The position is used and discarded: nothing is stored, sent anywhere, or
   * remembered between visits.
   */
  function findMe() {
    const map = mapRef.current;
    if (!map) return;

    if (!navigator.geolocation) {
      setLocateError("This browser can't share your location.");
      return;
    }

    setLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        const here: [number, number] = [coords.longitude, coords.latitude];

        meRef.current?.remove();
        const dot = document.createElement("div");
        dot.style.cssText =
          "width:16px;height:16px;border-radius:9999px;background:#1d4ed8;" +
          "border:3px solid white;box-shadow:0 0 0 6px rgba(29,78,216,0.25);";
        meRef.current = new mapboxgl.Marker({ element: dot })
          .setLngLat(here)
          .addTo(map);

        map.flyTo({ center: here, zoom: 14, essential: true });
      },
      () => {
        setLocating(false);
        // Denied, unavailable, or timed out -- the browser does not
        // meaningfully distinguish them, and the fix is the same either way.
        setLocateError("Couldn't get your location. Check location permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  useEffect(() => {
    if (!token || !containerRef.current || spots.length === 0) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: MANILA_CENTER,
      zoom: 10,
    });
    mapRef.current = map;

    const bounds = new mapboxgl.LngLatBounds();
    for (const spot of spots) bounds.extend([spot.lng, spot.lat]);

    const byId = new Map(spots.map((spot) => [spot.id, spot]));
    let popup: mapboxgl.Popup | null = null;

    /**
     * Drawn as map layers rather than as one HTML marker per listing.
     *
     * The old version placed a div per spot. At fifty listings that is fifty
     * elements the browser positions on every pan and zoom, and in BGC they sat
     * on top of each other -- a dozen shops in one block rendered as one
     * unreadable blob, so the densest, most useful part of the map was the part
     * you could not use. Clustering is the fix, and Mapbox can only cluster a
     * source it owns, which means the markers had to go.
     */
    function draw() {
      map.addSource(SOURCE, {
        type: "geojson",
        cluster: true,
        // Below this zoom the dots merge; above it every listing stands alone.
        clusterMaxZoom: 14,
        clusterRadius: 45,
        data: {
          type: "FeatureCollection",
          features: spots.map((spot) => ({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [spot.lng, spot.lat],
            },
            properties: { id: spot.id, category: spot.category },
          })),
        },
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: SOURCE,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#14120B",
          // Grows with the count, so a block of twenty reads as busier than a
          // pair -- the density is information, not noise.
          "circle-radius": ["step", ["get", "point_count"], 16, 5, 20, 15, 26],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#FFDE00",
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: SOURCE,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 13,
          // The pair Mapbox's own clustering example uses. A font the style
          // does not ship renders no label at all, which would leave silent
          // black circles with no number in them.
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        },
        paint: { "text-color": "#FFDE00" },
      });

      map.addLayer({
        id: "spot-point",
        type: "circle",
        source: SOURCE,
        filter: ["!", ["has", "point_count"]],
        paint: {
          // Built from SPOT_CATEGORIES so a new kind of place cannot end up
          // sharing a colour with another one unnoticed.
          "circle-color": [
            "match",
            ["get", "category"],
            ...SPOT_CATEGORIES.flatMap((entry) => [entry.value, entry.color]),
            UNKNOWN_CATEGORY_COLOR,
          ],
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#FFFFFF",
        },
      });
    }

    function onClusterClick(event: mapboxgl.MapMouseEvent) {
      const [feature] = map.queryRenderedFeatures(event.point, {
        layers: ["clusters"],
      });
      const clusterId = feature?.properties?.cluster_id;
      if (clusterId === undefined) return;

      const source = map.getSource(SOURCE) as mapboxgl.GeoJSONSource;
      source.getClusterExpansionZoom(clusterId, (error, zoom) => {
        if (error || zoom === null || zoom === undefined) return;
        map.easeTo({
          center: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
          zoom,
        });
      });
    }

    function onSpotClick(event: mapboxgl.MapMouseEvent) {
      const [feature] = map.queryRenderedFeatures(event.point, {
        layers: ["spot-point"],
      });
      const spot = byId.get(String(feature?.properties?.id ?? ""));
      if (!spot) return;

      popup?.remove();
      popup = new mapboxgl.Popup({ offset: 12 })
        .setLngLat([spot.lng, spot.lat])
        .setDOMContent(buildPopupElement(spot))
        .addTo(map);
    }

    const pointer = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const noPointer = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("load", () => {
      draw();
      map.on("click", "clusters", onClusterClick);
      map.on("click", "spot-point", onSpotClick);
      for (const layer of ["clusters", "spot-point"] as const) {
        map.on("mouseenter", layer, pointer);
        map.on("mouseleave", layer, noPointer);
      }
    });

    map.fitBounds(bounds, { padding: 60, maxZoom: 14 });

    return () => {
      popup?.remove();
      meRef.current?.remove();
      meRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [spots, token]);

  if (!token) {
    return (
      <div className="flex h-[70vh] items-center justify-center rounded-2xl bg-navey-band text-center text-sm text-navey-ink/60">
        Map isn&apos;t configured yet.
      </div>
    );
  }

  if (spots.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center rounded-2xl bg-navey-band text-center text-sm text-navey-ink/60">
        No spots have map coordinates yet.
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[70vh] w-full rounded-2xl" />

      <button
        type="button"
        onClick={findMe}
        disabled={locating}
        className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-navey-ink px-4 py-2 text-sm font-bold text-navey-yellow shadow-[0_8px_24px_rgba(20,18,11,0.25)] transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-70"
      >
        <span aria-hidden>◎</span>
        {locating ? "Finding you…" : "Near me"}
      </button>

      {locateError && (
        <p
          role="status"
          className="absolute right-4 top-16 max-w-[220px] rounded-xl bg-white px-3 py-2 text-xs font-semibold text-navey-ink shadow-[0_8px_24px_rgba(20,18,11,0.2)]"
        >
          {locateError}
        </p>
      )}
    </div>
  );
}
