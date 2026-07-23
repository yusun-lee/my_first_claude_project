import { describe, expect, it, vi } from "vitest"

import * as kakaoGeocode from "@/services/kakaoGeocode"

import { GET } from "./route"

vi.mock("@/services/kakaoGeocode")

describe("GET /api/geocode", () => {
  it("returns 404 with an error message when the address cannot be resolved", async () => {
    vi.mocked(kakaoGeocode.geocodeAddress).mockResolvedValue(null)

    const request = new Request(
      "http://localhost/api/geocode?query=asdkfjqwer1234"
    )
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toBe("주소를 찾을 수 없습니다")
  })

  it("returns the resolved location for a valid query", async () => {
    const location = {
      lat: 37.5,
      lng: 127.0555,
      addressName: "서울 강남구 테헤란로 133",
    }
    vi.mocked(kakaoGeocode.geocodeAddress).mockResolvedValue(location)

    const request = new Request(
      "http://localhost/api/geocode?query=" +
        encodeURIComponent("서울시 강남구 테헤란로")
    )
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(location)
  })

  it("returns 400 when query is missing", async () => {
    const request = new Request("http://localhost/api/geocode")
    const response = await GET(request)

    expect(response.status).toBe(400)
  })
})
