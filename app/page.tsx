"use client"

import { SearchBar } from "@/components/search-bar"

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <SearchBar onLocationFound={() => {}} />
    </main>
  )
}
