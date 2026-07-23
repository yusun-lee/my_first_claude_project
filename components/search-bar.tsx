"use client"

import * as React from "react"
import { AlertCircleIcon, SearchIcon } from "lucide-react"

import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type SearchBarProps = {
  onSubmit: (query: string) => void
  error?: string | null
  isLoading?: boolean
}

export function SearchBar({ onSubmit, error, isLoading }: SearchBarProps) {
  const [query, setQuery] = React.useState("")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!query.trim()) return
    onSubmit(query)
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
