/**
 * Server-only geocoding via Mapbox. Turns a free-text address into
 * lat/lng so the spot can show up as a pin on the Explore Map.
 */
export async function geocodeAddress(input: {
  address: string;
  city: string;
  province: string | null;
}): Promise<{ lat: number; lng: number } | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  const query = [input.address, input.city, input.province, "Philippines"]
    .filter(Boolean)
    .join(", ");
  if (!query.trim()) return null;

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("country", "PH");
  url.searchParams.set("limit", "1");

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;

    const data = await response.json();
    const feature = data.features?.[0];
    const center = feature?.center;
    if (!Array.isArray(center) || center.length !== 2) return null;

    const [lng, lat] = center;
    if (typeof lat !== "number" || typeof lng !== "number") return null;

    return { lat, lng };
  } catch {
    return null;
  }
}
