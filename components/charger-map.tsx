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

export function ChargerMap({
  center = SEOUL_CITY_HALL,
  stations = [],
}: ChargerMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<any>(null)
  const markersRef = React.useRef<any[]>([])
  const [selectedStation, setSelectedStation] = React.useState<Station | null>(
    null
  )

  function renderMarkers(stationsToRender: Station[]) {
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = stationsToRender.map((station) => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(station.lat, station.lng),
      })
      marker.setMap(mapRef.current)
      window.kakao.maps.event.addListener(marker, "click", () => {
        setSelectedStation(station)
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
    // Re-run only when the searched center changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng])

  React.useEffect(() => {
    if (!mapRef.current) return
    setSelectedStation(null)
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
      {selectedStation && (
        <div className="absolute bottom-4 left-4">
          <ChargerPopup
            station={selectedStation}
            onClose={() => setSelectedStation(null)}
          />
        </div>
      )}
    </div>
  )
}
