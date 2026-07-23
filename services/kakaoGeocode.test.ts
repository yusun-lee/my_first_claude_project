import { beforeEach, describe, expect, it, vi } from "vitest"

import { geocodeAddress } from "./kakaoGeocode"

describe("geocodeAddress", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  it("returns the top result's coordinates for a matched query", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        documents: [
          {
            address_name: "서울 강남구 테헤란로 133",
            x: "127.0555000",
            y: "37.5000000",
          },
          { address_name: "다른 후보", x: "0", y: "0" },
        ],
      }),
    } as Response)

    const result = await geocodeAddress("서울시 강남구 테헤란로")

    expect(result).toEqual({
      lat: 37.5,
      lng: 127.0555,
      addressName: "서울 강남구 테헤란로 133",
    })
  })

  it("returns null when no address matches", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [] }),
    } as Response)

    const result = await geocodeAddress("asdkfjqwer1234")

    expect(result).toBeNull()
  })

  it("returns null when the request fails", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response)

    const result = await geocodeAddress("서울시 강남구 테헤란로")

    expect(result).toBeNull()
  })
})
