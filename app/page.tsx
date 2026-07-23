"use client"

import { ChargerMap } from "@/components/charger-map"
import { SearchBar } from "@/components/search-bar"

export default function Page() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <SearchBar onLocationFound={() => {}} />
      <ChargerMap />
    </main>
  )
}
