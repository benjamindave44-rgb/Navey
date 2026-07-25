"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapSpot } from "@/lib/queries";

const CATEGORY_COLOR: Record<string, string> = {
  coffee_shop: "#14120B",
  restaurant: "#B45309",
  both: "#7C3AED",
};

const MANILA_CENTER: [number, number] = [121.0, 14.6];

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

    for (const spot of spots) {
      const el = document.createElement("div");
      el.style.cssText = `width:14px;height:14px;border-radius:9999px;background:${
        CATEGORY_COLOR[spot.category] ?? "#14120B"
      };border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);cursor:pointer;`;

      new mapboxgl.Marker({ element: el })
        .setLngLat([spot.lng, spot.lat])
        .setPopup(new mapboxgl.Popup({ offset: 12 }).setDOMContent(buildPopupElement(spot)))
        .addTo(map);

      bounds.extend([spot.lng, spot.lat]);
    }

    map.fitBounds(bounds, { padding: 60, maxZoom: 14 });

    return () => {
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

  return <div ref={containerRef} className="h-[70vh] w-full rounded-2xl" />;
}
