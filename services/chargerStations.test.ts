import { beforeEach, describe, expect, it, vi } from "vitest"

import { findNearbyStations } from "./chargerStations"

// center is (37.5, 127.0555); stations are placed ~4km and ~6km due north
// (1 degree latitude ≈ 111.19km), so the 5km radius must include only the first.
const RAW_STATIONS = [
  {
    충전소아이디: 1,
    충전소명: "4km 충전소",
    충전소주소: "서울 강남구",
    위도: "37.535975",
    경도: "127.0555000",
  },
  {
    충전소아이디: 2,
    충전소명: "6km 충전소",
    충전소주소: "서울 성북구",
    위도: "37.553963",
    경도: "127.0555000",
  },
]

describe("findNearbyStations", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  it("keeps only stations within the given radius", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: RAW_STATIONS }),
    } as Response)

    const result = await findNearbyStations({ lat: 37.5, lng: 127.0555 }, 5)

    expect(result).toEqual([
      {
        id: "1",
        name: "4km 충전소",
        address: "서울 강남구",
        lat: 37.535975,
        lng: 127.0555,
      },
    ])
  })

  it("returns an empty array when the request fails", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response)

    const result = await findNearbyStations({ lat: 37.5, lng: 127.0555 }, 5)

    expect(result).toEqual([])
  })
})
