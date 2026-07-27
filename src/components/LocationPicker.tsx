"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MANILA_CENTER: [number, number] = [121.0, 14.6];

/**
 * Address text geocoding is rarely pinpoint-accurate for a specific unit
 * inside a mall or building, so this lets the owner drag the pin onto the
 * exact spot. A manual drag always overrides the auto-geocoded coordinates.
 */
export function LocationPicker({
  lat,
  lng,
}: {
  lat: number | null;
  lng: number | null;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null;
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    lat: lat ?? MANILA_CENTER[1],
    lng: lng ?? MANILA_CENTER[0],
  });
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [position.lng, position.lat],
      zoom: lat != null && lng != null ? 16 : 11,
    });

    const marker = new mapboxgl.Marker({ draggable: true, color: "#14120B" })
      .setLngLat([position.lng, position.lat])
      .addTo(map);

    marker.on("dragend", () => {
      const next = marker.getLngLat();
      setPosition({ lat: next.lat, lng: next.lng });
      setMoved(true);
    });

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map is created once per mount
  }, [token]);

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
        Drag the pin if it isn&apos;t exactly on your spot. This is what shows
        on the Explore Map and powers &quot;Get Directions.&quot;
      </p>
      <div ref={containerRef} className="h-56 w-full rounded-2xl" />
      <input type="hidden" name="lat" value={position.lat} />
      <input type="hidden" name="lng" value={position.lng} />
      <input type="hidden" name="locationAdjusted" value={moved ? "true" : "false"} />
    </div>
  );
}
