import type { Artwork, ArtworkPage } from "../../types/art"

const API = "https://api.artic.edu/api/v1"
const FIELDS = [
  "id",
  "title",
  "artist_display",
  "date_display",
  "medium_display",
  "place_of_origin",
  "classification_title",
  "image_id",
  "thumbnail",
  "description",
].join(",")

interface ArticRecord {
  id: number
  title?: string
  artist_display?: string
  date_display?: string
  medium_display?: string
  place_of_origin?: string
  classification_title?: string
  image_id?: string
  thumbnail?: { alt_text?: string }
  description?: string
}

function normalize(item: ArticRecord): Artwork {
  return {
    id: item.id,
    title: item.title || "Untitled",
    artist: item.artist_display || "Artist unknown",
    date: item.date_display || "Date unknown",
    medium: item.medium_display || "Medium not recorded",
    origin: item.place_of_origin || "Origin not recorded",
    classification: item.classification_title || "Artwork",
    imageUrl: item.image_id
      ? `https://www.artic.edu/iiif/2/${item.image_id}/full/843,/0/default.jpg`
      : null,
    imageAlt:
      item.thumbnail?.alt_text ||
      item.title ||
      "Artwork from the Art Institute of Chicago",
    description: item.description,
    sourceUrl: `https://www.artic.edu/artworks/${item.id}`,
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
    page: String(page),
    limit: String(limit),
    fields: FIELDS,
  })
  const data = await request(`${API}/artworks/search?${params}`, signal)
  return {
    items: (data.data as ArticRecord[])
      .map(normalize)
      .filter((item) => item.imageUrl),
    page: data.pagination.current_page,
    totalPages: data.pagination.total_pages,
  }
}

export async function getArtwork(
  id: string,
  signal?: AbortSignal,
): Promise<Artwork> {
  const data = await request(`${API}/artworks/${id}?fields=${FIELDS}`, signal)
  return normalize(data.data)
}

export async function getArtworkImageFallback(
  artwork: Pick<Artwork, "title" | "artist">,
  signal?: AbortSignal,
): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${artwork.title} ${artwork.artist}`,
    gsrnamespace: "6",
    gsrlimit: "8",
    prop: "imageinfo",
    iiprop: "url|mime",
    iiurlwidth: "1200",
    format: "json",
    origin: "*",
  })
  const response = await fetch(
    `https://en.wikipedia.org/w/api.php?${params}`,
    { signal },
  )
  if (!response.ok) return null
  const data = await response.json()
  const pages = Object.values(data.query?.pages ?? []) as Array<{
    index: number
    title: string
    imageinfo?: Array<{ thumburl?: string; mime?: string }>
  }>
  pages.sort((first, second) => first.index - second.index)
  const image = pages.find((page) => {
    const mime = page.imageinfo?.[0]?.mime
    return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp"
  })
  return image?.imageinfo?.[0]?.thumburl ?? null
}
