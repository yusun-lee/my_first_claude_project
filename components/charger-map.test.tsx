import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ChargerMap } from "./charger-map"

class FakeLatLng {
  constructor(
    public lat: number,
    public lng: number
  ) {}
}

type FakeMap = { center: FakeLatLng; setCenter: (latLng: FakeLatLng) => void }
type FakeMarker = {
  position: FakeLatLng
  map: unknown
  handlers: Record<string, () => void>
}

function stubKakaoSdk(mapInstances: FakeMap[], markerInstances: FakeMarker[]) {
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
        position: FakeLatLng
        map: unknown = null
        handlers: Record<string, () => void> = {}
        constructor(options: { position: FakeLatLng }) {
          this.position = options.position
          markerInstances.push(this)
        }
        setMap(map: unknown) {
          this.map = map
        }
      },
      event: {
        addListener: (
          target: FakeMarker,
          event: string,
          handler: () => void
        ) => {
          target.handlers[event] = handler
        },
      },
    },
  }
}

// next/script never removes its <script> tag on unmount (by design, so a
// script already fetched isn't re-fetched on remount), so every test's
// script node accumulates in the document. Always target the most recently
// appended one, not the first.
function lastKakaoScript() {
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    "script[src*='dapi.kakao.com']"
  )
  return scripts[scripts.length - 1]
}

function triggerSdkLoad() {
  lastKakaoScript()?.dispatchEvent(new Event("load"))
}

// next/script also caches load state per `src` in a module-level Map/Set
// that survives across tests in this file, so onLoad only fires once per
// src. Each test uses a distinct key to get its own src and its own onLoad.
let keySequence = 0
function uniqueJsKey() {
  keySequence += 1
  return `test-js-key-${keySequence}`
}

describe("ChargerMap", () => {
  it("renders a map container", () => {
    vi.stubEnv("NEXT_PUBLIC_KAKAO_JS_KEY", uniqueJsKey())
    stubKakaoSdk([], [])
    render(<ChargerMap />)
    expect(screen.getByTestId("charger-map")).toBeInTheDocument()
  })

  it("loads the Kakao Maps SDK script with the configured JS key", () => {
    const key = uniqueJsKey()
    vi.stubEnv("NEXT_PUBLIC_KAKAO_JS_KEY", key)
    stubKakaoSdk([], [])
    render(<ChargerMap />)
    expect(lastKakaoScript()?.getAttribute("src")).toContain(`appkey=${key}`)
  })

  it("[S1-1] moves the map center to the searched location", async () => {
    vi.stubEnv("NEXT_PUBLIC_KAKAO_JS_KEY", uniqueJsKey())
    const maps: FakeMap[] = []
    stubKakaoSdk(maps, [])

    const { rerender } = render(
      <ChargerMap center={{ lat: 37.1, lng: 127.2 }} />
    )
    triggerSdkLoad()

    rerender(<ChargerMap center={{ lat: 35.5, lng: 129.0 }} />)

    await waitFor(() => {
      expect(maps[0]?.center).toEqual(new FakeLatLng(35.5, 129.0))
    })
  })

  it("[S1-2] renders one marker per station", async () => {
    vi.stubEnv("NEXT_PUBLIC_KAKAO_JS_KEY", uniqueJsKey())
    const markers: FakeMarker[] = []
    stubKakaoSdk([], markers)

    const stations = [
      { id: "1", name: "A", address: "주소 A", lat: 37.1, lng: 127.2 },
      { id: "2", name: "B", address: "주소 B", lat: 37.2, lng: 127.3 },
      { id: "3", name: "C", address: "주소 C", lat: 37.3, lng: 127.4 },
    ]

    render(<ChargerMap stations={stations} />)
    triggerSdkLoad()

    await waitFor(() => {
      const activeMarkers = markers.filter((marker) => marker.map !== null)
      expect(activeMarkers).toHaveLength(3)
    })
  })

  it("[S1-4] shows a popup with the station's name and address when its marker is clicked", async () => {
    vi.stubEnv("NEXT_PUBLIC_KAKAO_JS_KEY", uniqueJsKey())
    const markers: FakeMarker[] = []
    stubKakaoSdk([], markers)

    const stations = [
      {
        id: "1",
        name: "테헤란로 충전소",
        address: "서울 강남구 테헤란로 133",
        lat: 37.1,
        lng: 127.2,
      },
    ]

    render(<ChargerMap stations={stations} />)
    triggerSdkLoad()

    await waitFor(() => expect(markers).toHaveLength(1))
    markers[0].handlers.click()

    expect(await screen.findByText("테헤란로 충전소")).toBeInTheDocument()
    expect(screen.getByText("서울 강남구 테헤란로 133")).toBeInTheDocument()
  })
})
