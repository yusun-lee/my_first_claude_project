"use client"

import * as React from "react"
import Script from "next/script"

import { ChargerPopup } from "@/components/charger-popup"
import type { Station } from "@/types/station"

declare global {
  interface Window {
    kakao: any
  }
}

const SEOUL_CITY_HALL = { lat: 37.5663, lng: 126.9779 }

type ChargerMapProps = {
  center?: { lat: number; lng: number }
  stations?: Station[]
}

type SelectedMarker = {
  station: Station
  x: number
  y: number
}

export function ChargerMap({
  center = SEOUL_CITY_HALL,
  stations = [],
}: ChargerMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<any>(null)
  const markersRef = React.useRef<any[]>([])
  const [selected, setSelected] = React.useState<SelectedMarker | null>(null)

  function renderMarkers(stationsToRender: Station[]) {
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = stationsToRender.map((station) => {
      const position = new window.kakao.maps.LatLng(station.lat, station.lng)
      const marker = new window.kakao.maps.Marker({ position })
      marker.setMap(mapRef.current)
      window.kakao.maps.event.addListener(marker, "click", () => {
        const point = mapRef.current
          .getProjection()
          .containerPointFromCoords(position)
        setSelected({ station, x: point.x, y: point.y })
      })
      return marker
    })
  }

  function initializeMap() {
    window.kakao.maps.load(() => {
      if (!containerRef.current) return
      mapRef.current = new window.kakao.maps.Map(containerRef.current, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level: 5,
      })
      renderMarkers(stations)
    })
  }

  React.useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.setCenter(
      new window.kakao.maps.LatLng(center.lat, center.lng)
    )
    setSelected(null)
    // Re-run only when the searched center changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng])

  React.useEffect(() => {
    if (!mapRef.current) return
    setSelected(null)
    renderMarkers(stations)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations])

  return (
    <div className="relative">
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&autoload=false`}
        strategy="afterInteractive"
        onLoad={initializeMap}
      />
      <div
        ref={containerRef}
        data-testid="charger-map"
        className="h-[420px] w-full rounded border"
      />
      {selected && (
        <div
          className="absolute -translate-x-1/2 -translate-y-[calc(100%+12px)]"
          style={{ left: selected.x, top: selected.y }}
        >
          <ChargerPopup
            station={selected.station}
            onClose={() => setSelected(null)}
          />
        </div>
      )}
    </div>
  )
}
