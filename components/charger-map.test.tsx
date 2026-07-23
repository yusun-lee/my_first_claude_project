import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ChargerMap } from "./charger-map"

describe("ChargerMap", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_KAKAO_JS_KEY", "test-js-key")
  })

  it("renders a map container", () => {
    render(<ChargerMap />)
    expect(screen.getByTestId("charger-map")).toBeInTheDocument()
  })

  it("loads the Kakao Maps SDK script with the configured JS key", () => {
    render(<ChargerMap />)
    const script = document.querySelector("script[src*='dapi.kakao.com']")
    expect(script?.getAttribute("src")).toContain("appkey=test-js-key")
  })
})
