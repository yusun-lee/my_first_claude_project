import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import Page from "./page"

class FakeLatLng {
  constructor(
    public lat: number,
    public lng: number
  ) {}
}

type FakeMarker = { map: unknown }
type FakeMap = { center: FakeLatLng; setCenter: (latLng: FakeLatLng) => void }

function stubKakaoSdk(
  markerInstances: FakeMarker[],
  mapInstances: FakeMap[] = []
) {
  window.kakao = {
    maps: {
      load: (callback: () => void) => callback(),
      LatLng: FakeLatLng,
      Map: class {
        center: FakeLatLng
        constructor(_container: HTMLElement, options: { center: FakeLatLng }) {
          this.center = options.center
          mapInstances.push(this)
        }
        setCenter(latLng: FakeLatLng) {
          this.center = latLng
        }
        getProjection() {
          return {
            containerPointFromCoords: (latLng: FakeLatLng) => ({
              x: latLng.lng,
              y: latLng.lat,
            }),
          }
        }
      },
      Marker: class {
        map: unknown = null
        constructor(public options: { position: FakeLatLng }) {
          markerInstances.push(this)
        }
        setMap(map: unknown) {
          this.map = map
        }
      },
      event: {
        addListener: () => {},
      },
    },
  }
}

function triggerSdkLoad() {
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    "script[src*='dapi.kakao.com']"
  )
  scripts[scripts.length - 1]?.dispatchEvent(new Event("load"))
}

let keySequence = 0

describe("Page", () => {
  beforeEach(() => {
    keySequence += 1
    vi.stubEnv("NEXT_PUBLIC_KAKAO_JS_KEY", `test-js-key-${keySequence}`)
    vi.stubGlobal("fetch", vi.fn())
  })

  it("[S3] renders a marker for an ambiguous region name without asking the user to pick a candidate", async () => {
    const markers: FakeMarker[] = []
    stubKakaoSdk(markers)

    const location = {
      lat: 37.4979,
      lng: 127.0276,
      addressName: "서울 강남구",
    }
    const stations = [
      {
        id: "1",
        name: "강남 충전소",
        address: "서울 강남구",
        lat: 37.4979,
        lng: 127.0276,
      },
    ]

    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes("/api/geocode")) {
        return { ok: true, json: async () => location } as Response
      }
      if (url.includes("/api/stations")) {
        return { ok: true, json: async () => stations } as Response
      }
      throw new Error(`Unexpected fetch: ${url}`)
    })

    const user = userEvent.setup()
    render(<Page />)
    triggerSdkLoad()

    await user.type(screen.getByLabelText("주소나 지역명"), "강남")
    await user.click(screen.getByRole("button", { name: "검색" }))

    await waitFor(() => {
      const activeMarkers = markers.filter((marker) => marker.map !== null)
      expect(activeMarkers).toHaveLength(1)
    })

    // No candidate list/picker is ever shown to the user.
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(screen.queryByText(/후보/)).not.toBeInTheDocument()
  })

  it("[S2-2] keeps existing markers when a follow-up search fails to resolve", async () => {
    const markers: FakeMarker[] = []
    stubKakaoSdk(markers)

    const location = {
      lat: 37.4979,
      lng: 127.0276,
      addressName: "서울 강남구",
    }
    const stations = [
      {
        id: "1",
        name: "강남 충전소",
        address: "서울 강남구",
        lat: 37.4979,
        lng: 127.0276,
      },
    ]

    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes("/api/geocode")) {
        if (url.includes(encodeURIComponent("asdkfjqwer1234"))) {
          return {
            ok: false,
            json: async () => ({ error: "주소를 찾을 수 없습니다" }),
          } as Response
        }
        return { ok: true, json: async () => location } as Response
      }
      if (url.includes("/api/stations")) {
        return { ok: true, json: async () => stations } as Response
      }
      throw new Error(`Unexpected fetch: ${url}`)
    })

    const user = userEvent.setup()
    render(<Page />)
    triggerSdkLoad()

    await user.type(screen.getByLabelText("주소나 지역명"), "서울시 강남구")
    await user.click(screen.getByRole("button", { name: "검색" }))

    await waitFor(() => {
      const activeMarkers = markers.filter((marker) => marker.map !== null)
      expect(activeMarkers).toHaveLength(1)
    })

    await user.clear(screen.getByLabelText("주소나 지역명"))
    await user.type(screen.getByLabelText("주소나 지역명"), "asdkfjqwer1234")
    await user.click(screen.getByRole("button", { name: "검색" }))

    expect(
      await screen.findByText("주소를 찾을 수 없습니다")
    ).toBeInTheDocument()

    const activeMarkers = markers.filter((marker) => marker.map !== null)
    expect(activeMarkers).toHaveLength(1)
  })

  it("[S4-1][S4-2] shows a no-stations notice and moves the map center when the radius has no stations", async () => {
    const markers: FakeMarker[] = []
    const maps: FakeMap[] = []
    stubKakaoSdk(markers, maps)

    const location = {
      lat: 38.0,
      lng: 128.4,
      addressName: "강원도 인제군 진동리",
    }

    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes("/api/geocode")) {
        return { ok: true, json: async () => location } as Response
      }
      if (url.includes("/api/stations")) {
        return { ok: true, json: async () => [] } as Response
      }
      throw new Error(`Unexpected fetch: ${url}`)
    })

    const user = userEvent.setup()
    render(<Page />)
    triggerSdkLoad()

    await user.type(screen.getByLabelText("주소나 지역명"), "강원도 인제군 진동리")
    await user.click(screen.getByRole("button", { name: "검색" }))

    expect(
      await screen.findByText("주변 5km에 충전소가 없습니다")
    ).toBeInTheDocument()

    expect(maps[0]?.center).toEqual(new FakeLatLng(38.0, 128.4))
    expect(markers.filter((marker) => marker.map !== null)).toHaveLength(0)
  })
})
