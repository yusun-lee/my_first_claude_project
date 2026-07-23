import { findNearbyStations } from "@/services/chargerStations"

const SEARCH_RADIUS_KM = 5

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = Number(searchParams.get("lat"))
  const lng = Number(searchParams.get("lng"))

  if (!searchParams.get("lat") || !searchParams.get("lng") || Number.isNaN(lat) || Number.isNaN(lng)) {
    return Response.json({ error: "lat/lng is required" }, { status: 400 })
  }

  const stations = await findNearbyStations({ lat, lng }, SEARCH_RADIUS_KM)

  return Response.json(stations)
}
