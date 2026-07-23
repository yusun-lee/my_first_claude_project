"use client"

import * as React from "react"
import { AlertCircleIcon, SearchIcon } from "lucide-react"

import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Location } from "@/types/location"

type SearchBarProps = {
  onLocationFound: (location: Location) => void
}

export function SearchBar({ onLocationFound }: SearchBarProps) {
  const [query, setQuery] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)

    const response = await fetch(
      `/api/geocode?query=${encodeURIComponent(query)}`
    )
    const body = await response.json()

    setIsLoading(false)

    if (!response.ok) {
      setError(body.error ?? "주소를 찾을 수 없습니다")
      return
    }

    onLocationFound(body as Location)
  }

  return (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 md:flex-row md:items-center"
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="주소나 지역명을 입력하세요"
          aria-label="주소나 지역명"
        />
        <Button type="submit" disabled={isLoading}>
          <SearchIcon data-icon="inline-start" />
          검색
        </Button>
      </form>
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}
    </div>
  )
}
