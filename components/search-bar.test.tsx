import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SearchBar } from "./search-bar"

describe("SearchBar", () => {
  it("calls onSubmit with the entered query", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<SearchBar onSubmit={onSubmit} />)

    await user.type(
      screen.getByLabelText("주소나 지역명"),
      "서울시 강남구 테헤란로"
    )
    await user.click(screen.getByRole("button", { name: "검색" }))

    expect(onSubmit).toHaveBeenCalledWith("서울시 강남구 테헤란로")
  })

  it("[S2-1] shows the error message when the error prop is set", () => {
    render(
      <SearchBar onSubmit={vi.fn()} error="주소를 찾을 수 없습니다" />
    )

    expect(screen.getByText("주소를 찾을 수 없습니다")).toBeInTheDocument()
  })

  it("does not call onSubmit for a blank query", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<SearchBar onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button", { name: "검색" }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("does not call onSubmit again while a search is already loading", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<SearchBar onSubmit={onSubmit} isLoading />)

    // The button is disabled, but Enter still submits the form -- verify
    // the handler itself also guards against this, not just the button.
    await user.type(
      screen.getByLabelText("주소나 지역명"),
      "서울시 강남구 테헤란로{Enter}"
    )

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
