import { describe, expect, it, vi } from "vitest"

import * as chargerStations from "@/services/chargerStations"

import { GET } from "./route"

vi.mock("@/services/chargerStations")

describe("GET /api/stations", () => {
  it("returns stations filtered by lat/lng within a 5km radius", async () => {
    const stations = [
      {
        id: "1",
        name: "테헤란로 충전소",
        address: "서울 강남구 테헤란로 133",
        lat: 37.5,
        lng: 127.0555,
      },
    ]
    vi.mocked(chargerStations.findNearbyStations).mockResolvedValue(stations)

    const request = new Request(
      "http://localhost/api/stations?lat=37.5&lng=127.0555"
    )
    const response = await GET(request)
    const body = await response.json()

    expect(chargerStations.findNearbyStations).toHaveBeenCalledWith(
      { lat: 37.5, lng: 127.0555 },
      5
    )
    expect(response.status).toBe(200)
    expect(body).toEqual(stations)
  })

  it("returns 400 when lat/lng are missing", async () => {
    const request = new Request("http://localhost/api/stations")
    const response = await GET(request)

    expect(response.status).toBe(400)
  })
})
