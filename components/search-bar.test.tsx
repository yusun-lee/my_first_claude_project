import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SearchBar } from "./search-bar"

describe("SearchBar", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  it("[S2-1] shows an error message when the address cannot be resolved", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "주소를 찾을 수 없습니다" }),
    } as Response)

    const user = userEvent.setup()
    render(<SearchBar onLocationFound={vi.fn()} />)

    await user.type(
      screen.getByLabelText("주소나 지역명"),
      "asdkfjqwer1234"
    )
    await user.click(screen.getByRole("button", { name: "검색" }))

    expect(
      await screen.findByText("주소를 찾을 수 없습니다")
    ).toBeInTheDocument()
  })

  it("calls onLocationFound with the resolved location on a successful search", async () => {
    const location = {
      lat: 37.5,
      lng: 127.0555,
      addressName: "서울 강남구 테헤란로 133",
    }
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => location,
    } as Response)

    const onLocationFound = vi.fn()
    const user = userEvent.setup()
    render(<SearchBar onLocationFound={onLocationFound} />)

    await user.type(
      screen.getByLabelText("주소나 지역명"),
      "서울시 강남구 테헤란로"
    )
    await user.click(screen.getByRole("button", { name: "검색" }))

    await waitFor(() =>
      expect(onLocationFound).toHaveBeenCalledWith(location)
    )
  })
})
