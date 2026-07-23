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

function stubKakaoSdk(markerInstances: FakeMarker[]) {
  window.kakao = {
    maps: {
      load: (callback: () => void) => callback(),
      LatLng: FakeLatLng,
      Map: class {
        constructor(_container: HTMLElement, _options: unknown) {}
        setCenter() {}
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
})
