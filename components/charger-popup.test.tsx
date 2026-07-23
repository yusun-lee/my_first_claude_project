import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ChargerPopup } from "./charger-popup"

const STATION = {
  id: "1",
  name: "테헤란로 충전소",
  address: "서울 강남구 테헤란로 133",
  lat: 37.5,
  lng: 127.0555,
}

describe("ChargerPopup", () => {
  it("[S1-4] shows the station name and address", () => {
    render(<ChargerPopup station={STATION} onClose={vi.fn()} />)

    expect(screen.getByText("테헤란로 충전소")).toBeInTheDocument()
    expect(screen.getByText("서울 강남구 테헤란로 133")).toBeInTheDocument()
  })

  it("calls onClose when the close button is clicked", async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ChargerPopup station={STATION} onClose={onClose} />)

    await user.click(screen.getByRole("button", { name: "닫기" }))

    expect(onClose).toHaveBeenCalled()
  })

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ChargerPopup station={STATION} onClose={onClose} />)

    await user.keyboard("{Escape}")

    expect(onClose).toHaveBeenCalled()
  })
})
