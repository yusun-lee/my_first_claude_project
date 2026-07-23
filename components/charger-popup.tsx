"use client"

import { XIcon } from "lucide-react"

import type { Station } from "@/types/station"

type ChargerPopupProps = {
  station: Station
  onClose: () => void
}

export function ChargerPopup({ station, onClose }: ChargerPopupProps) {
  return (
    <div
      role="dialog"
      aria-label={station.name}
      className="w-56 rounded border bg-background p-2 text-sm shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-bold">{station.name}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="text-muted-foreground"
        >
          <XIcon className="size-3" />
        </button>
      </div>
      <div className="text-muted-foreground">{station.address}</div>
    </div>
  )
}
