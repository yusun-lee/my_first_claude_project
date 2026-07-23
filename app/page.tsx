"use client"

import { InfoIcon } from "lucide-react"

import { ChargerMap } from "@/components/charger-map"
import { SearchBar } from "@/components/search-bar"
import { StationTable } from "@/components/station-table"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { useStationSearch } from "@/hooks/useStationSearch"

export default function Page() {
  const { center, stations, error, isLoading, search } = useStationSearch()
  const showEmptyRadiusNotice = center !== null && stations.length === 0

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <SearchBar onSubmit={search} error={error} isLoading={isLoading} />
      {showEmptyRadiusNotice && (
        <Alert>
          <InfoIcon />
          <AlertTitle>주변 5km에 충전소가 없습니다</AlertTitle>
        </Alert>
      )}
      <ChargerMap center={center ?? undefined} stations={stations} />
      {stations.length > 0 && <StationTable stations={stations} />}
    </main>
  )
}
