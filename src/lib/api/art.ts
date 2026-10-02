import type { Artwork, ArtworkPage } from "../../types/art"

const API = "https://openaccess-api.clevelandart.org/api/artworks"
const FIELDS = [
  "id",
  "title",
  "creators",
  "creation_date",
  "technique",
  "department",
  "collection",
  "images",
  "share_license_status",
  "url",
  "wall_description",
  "culture",
].join(",")

interface ClevelandArtwork {
  id: number
  title?: string
  creators?: Array<{
    description?: string
    role?: string | null
  }>
  creation_date?: string
  technique?: string
  department?: string
  collection?: string
  images?: { web?: { url?: string } }
  share_license_status?: string
  url?: string
  wall_description?: string | null
  culture?: string[]
}

function normalize(item: ClevelandArtwork): Artwork {
  const artist =
    item.creators?.find((creator) => creator.role === "artist") ??
    item.creators?.[0]
  return {
    id: item.id,
    title: item.title || "Untitled",
    artist: artist?.description || "Artist unknown",
    date: item.creation_date || "Date unknown",
    medium: item.technique || "Medium not recorded",
    origin: item.culture?.join(", ") || "Origin not recorded",
    classification: item.collection || item.department || "Artwork",
    imageUrl:
      item.share_license_status === "CC0"
        ? item.images?.web?.url || null
        : null,
    imageAlt: `${item.title || "Artwork"} by ${artist?.description || "unknown artist"}`,
    description: item.wall_description || undefined,
    sourceUrl: item.url || `https://www.clevelandart.org/`,
  }
}

async function request(url: string, signal?: AbortSignal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error("The collection could not be reached.")
  return response.json()
}

export async function getArtworks(
  query = "",
  page = 1,
  limit = 12,
  signal?: AbortSignal,
): Promise<ArtworkPage> {
  const params = new URLSearchParams({
    q: query || "painting",
    has_image: "1",
    skip: String((page - 1) * limit),
    limit: String(limit),
    fields: FIELDS,
  })
  const data = await request(`${API}/?${params}`, signal)
  return {
    items: (data.data as ClevelandArtwork[])
      .filter((item) => item.share_license_status === "CC0")
      .map(normalize)
      .filter((item) => item.imageUrl),
    page,
    totalPages: Math.ceil(data.info.total / limit),
  }
}

export async function getArtwork(
  id: string,
  signal?: AbortSignal,
): Promise<Artwork> {
  const data = await request(`${API}/${id}?fields=${FIELDS}`, signal)
  return normalize(data.data)
}
