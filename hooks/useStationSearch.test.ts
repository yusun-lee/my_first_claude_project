import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useStationSearch } from "./useStationSearch"

describe("useStationSearch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  it("resolves the address then loads nearby stations", async () => {
    const location = {
      lat: 37.5,
      lng: 127.0555,
      addressName: "서울 강남구 테헤란로 133",
    }
    const stations = [
      {
        id: "1",
        name: "테헤란로 충전소",
        address: "서울 강남구",
        lat: 37.5,
        lng: 127.0555,
      },
    ]

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => location,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => stations,
      } as Response)

    const { result } = renderHook(() => useStationSearch())

    await act(async () => {
      await result.current.search("서울시 강남구 테헤란로")
    })

    expect(result.current.center).toEqual(location)
    expect(result.current.stations).toEqual(stations)
    expect(result.current.error).toBeNull()
  })

  it("sets an error and keeps previous state when geocoding fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "주소를 찾을 수 없습니다" }),
    } as Response)

    const { result } = renderHook(() => useStationSearch())

    await act(async () => {
      await result.current.search("asdkfjqwer1234")
    })

    expect(result.current.error).toBe("주소를 찾을 수 없습니다")
    expect(result.current.center).toBeNull()
    expect(result.current.stations).toEqual([])
  })

  it("[S5][INV-1] replaces previous stations entirely on a follow-up search", async () => {
    const firstLocation = {
      lat: 37.5,
      lng: 127.0555,
      addressName: "서울 강남구 테헤란로 133",
    }
    const firstStations = [
      {
        id: "1",
        name: "테헤란로 충전소",
        address: "서울 강남구",
        lat: 37.5,
        lng: 127.0555,
      },
      {
        id: "2",
        name: "역삼동 충전소",
        address: "서울 강남구 역삼동",
        lat: 37.501,
        lng: 127.0366,
      },
    ]
    const secondLocation = {
      lat: 35.1796,
      lng: 129.0756,
      addressName: "부산광역시",
    }
    const secondStations = [
      {
        id: "3",
        name: "부산 충전소",
        address: "부산광역시",
        lat: 35.1796,
        lng: 129.0756,
      },
    ]

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => firstLocation,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => firstStations,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => secondLocation,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => secondStations,
      } as Response)

    const { result } = renderHook(() => useStationSearch())

    await act(async () => {
      await result.current.search("서울시 강남구 테헤란로")
    })
    expect(result.current.stations).toEqual(firstStations)

    await act(async () => {
      await result.current.search("부산광역시")
    })

    expect(result.current.stations).toEqual(secondStations)
    expect(result.current.stations).not.toContainEqual(firstStations[0])
    expect(result.current.stations).not.toContainEqual(firstStations[1])
  })
})
