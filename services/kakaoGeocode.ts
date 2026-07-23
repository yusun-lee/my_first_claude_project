import type { Location } from "@/types/location"

export async function geocodeAddress(query: string): Promise<Location | null> {
  const url = new URL("https://dapi.kakao.com/v2/local/search/address.json")
  url.searchParams.set("query", query)

  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
    },
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  const topResult = data.documents?.[0]

  if (!topResult) {
    return null
  }

  return {
    lat: Number(topResult.y),
    lng: Number(topResult.x),
    addressName: topResult.address_name,
  }
}
