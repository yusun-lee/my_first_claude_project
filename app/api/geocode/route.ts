import { geocodeAddress } from "@/services/kakaoGeocode"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")

  if (!query) {
    return Response.json({ error: "query is required" }, { status: 400 })
  }

  const location = await geocodeAddress(query)

  if (!location) {
    return Response.json(
      { error: "주소를 찾을 수 없습니다" },
      { status: 404 }
    )
  }

  return Response.json(location)
}
