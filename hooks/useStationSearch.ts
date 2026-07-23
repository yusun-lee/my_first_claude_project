"use client"

import * as React from "react"

import type { Location } from "@/types/location"
import type { Station } from "@/types/station"

type SearchState = {
  center: Location | null
  stations: Station[]
  error: string | null
  isLoading: boolean
}

const INITIAL_STATE: SearchState = {
  center: null,
  stations: [],
  error: null,
  isLoading: false,
}

export function useStationSearch() {
  const [state, setState] = React.useState<SearchState>(INITIAL_STATE)

  async function search(query: string) {
    setState((previous) => ({ ...previous, isLoading: true, error: null }))

    const geocodeResponse = await fetch(
      `/api/geocode?query=${encodeURIComponent(query)}`
    )
    const geocodeBody = await geocodeResponse.json()

    if (!geocodeResponse.ok) {
      setState((previous) => ({
        ...previous,
        isLoading: false,
        error: geocodeBody.error ?? "주소를 찾을 수 없습니다",
      }))
      return
    }

    const center: Location = geocodeBody

    const stationsResponse = await fetch(
      `/api/stations?lat=${center.lat}&lng=${center.lng}`
    )
    const stations: Station[] = stationsResponse.ok
      ? await stationsResponse.json()
      : []

    setState({ center, stations, error: null, isLoading: false })
  }

  return { ...state, search }
}
