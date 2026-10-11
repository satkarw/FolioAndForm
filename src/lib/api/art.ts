import type { Artwork, ArtworkPage } from "../../types/art"

const API = "https://openaccess-api.clevelandart.org/api/artworks"
const ART_TYPES = [
  { name: "Painting", pageSize: 3 },
  { name: "Drawing", pageSize: 2 },
  { name: "Print", pageSize: 9 },
  { name: "Photograph", pageSize: 1 },
] as const
const FIELDS = [
  "id",
  "title",
  "type",
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
  type?: string
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
    classification: item.type || item.collection || item.department || "Artwork",
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
  const targetSizes = ART_TYPES.map(({ pageSize }) => (limit * pageSize) / 15)
  const pageSizes = targetSizes.map((size) => Math.floor(size))
  for (let index = 0; index < pageSizes.length; index += 1) {
    pageSizes[index] = Math.max(1, pageSizes[index])
  }
  while (pageSizes.reduce((sum, size) => sum + size, 0) > limit) {
    const index = pageSizes.reduce(
      (smallest, size, current) =>
        size > 1 &&
        (smallest === -1 ||
          targetSizes[current] - Math.floor(targetSizes[current]) <
            targetSizes[smallest] - Math.floor(targetSizes[smallest]))
          ? current
          : smallest,
      -1,
    )
    if (index === -1) break
    pageSizes[index] -= 1
  }
  while (pageSizes.reduce((sum, size) => sum + size, 0) < limit) {
    const index = targetSizes.reduce(
      (largest, target, current) =>
        target - pageSizes[current] > targetSizes[largest] - pageSizes[largest]
          ? current
          : largest,
      0,
    )
    pageSizes[index] += 1
  }
  const collections = await Promise.all(
    ART_TYPES.map(async ({ name }, index) => {
      const pageSize = pageSizes[index]
      const params = new URLSearchParams({
        cc0: "",
        has_image: "1",
        skip: String((page - 1) * pageSize),
        limit: String(pageSize),
        fields: FIELDS,
        type: name,
      })
      if (query.trim()) params.set("q", query.trim())
      const data = await request(`${API}/?${params}`, signal)
      return {
        items: (data.data as ClevelandArtwork[])
          .filter(
            (item) =>
              item.type === name &&
              item.share_license_status === "CC0" &&
              item.images?.web?.url,
          )
          .map(normalize),
        totalPages: Math.ceil(data.info.total / pageSize),
      }
    }),
  )
  const items: Artwork[] = []
  for (let index = 0; collections.some(({ items }) => items[index]); index += 1) {
    for (const collection of collections) {
      const item = collection.items[index]
      if (item) items.push(item)
    }
  }
  return {
    items,
    page,
    totalPages: Math.max(...collections.map(({ totalPages }) => totalPages)),
  }
}

export async function getArtwork(
  id: string,
  signal?: AbortSignal,
): Promise<Artwork> {
  const data = await request(`${API}/${id}?fields=${FIELDS}`, signal)
  if (!ART_TYPES.some(({ name }) => data.data.type === name))
    throw new Error("This record is not a painting, drawing, print, or photograph.")
  return normalize(data.data)
}
