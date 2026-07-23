"use client"

import { ChargerMap } from "@/components/charger-map"
import { SearchBar } from "@/components/search-bar"
import { useStationSearch } from "@/hooks/useStationSearch"

export default function Page() {
  const { center, stations, error, isLoading, search } = useStationSearch()

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <SearchBar onSubmit={search} error={error} isLoading={isLoading} />
      <ChargerMap center={center ?? undefined} stations={stations} />
    </main>
  )
}
