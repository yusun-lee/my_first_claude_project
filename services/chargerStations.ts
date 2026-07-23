import type { Station } from "@/types/station"

const EARTH_RADIUS_KM = 6371
const STATIONS_ENDPOINT =
  "https://api.odcloud.kr/api/15039545/v1/uddi:9d89628d-afe8-4b41-8f61-fa9636ce9e8e"
// The full dataset has ~4,400 rows; a single large page avoids a pagination loop.
const MAX_PER_PAGE = 10000

type RawStation = {
  충전소아이디: number
  충전소명: string
  충전소주소: string
  위도: string
  경도: string
}

function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

export async function findNearbyStations(
  center: { lat: number; lng: number },
  radiusKm: number
): Promise<Station[]> {
  const url = new URL(STATIONS_ENDPOINT)
  url.searchParams.set("page", "1")
  url.searchParams.set("perPage", String(MAX_PER_PAGE))

  const response = await fetch(url, {
    headers: {
      Authorization: `Infuser ${process.env.DATA_GO_KR_SERVICE_KEY}`,
    },
  })

  if (!response.ok) {
    return []
  }

  const body = (await response.json()) as { data: RawStation[] }

  return body.data
    .map(
      (raw): Station => ({
        id: String(raw.충전소아이디),
        name: raw.충전소명,
        address: raw.충전소주소,
        lat: Number(raw.위도),
        lng: Number(raw.경도),
      })
    )
    .filter((station) => haversineDistanceKm(center, station) <= radiusKm)
}
