"use client"

import * as React from "react"
import Script from "next/script"

declare global {
  interface Window {
    kakao: any
  }
}

const SEOUL_CITY_HALL = { lat: 37.5663, lng: 126.9779 }

type ChargerMapProps = {
  center?: { lat: number; lng: number }
}

export function ChargerMap({ center = SEOUL_CITY_HALL }: ChargerMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<any>(null)

  function initializeMap() {
    window.kakao.maps.load(() => {
      if (!containerRef.current) return
      mapRef.current = new window.kakao.maps.Map(containerRef.current, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level: 5,
      })
    })
  }

  React.useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.setCenter(
      new window.kakao.maps.LatLng(center.lat, center.lng)
    )
  }, [center])

  return (
    <>
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
    </>
  )
}
