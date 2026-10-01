export interface Artwork {
  id: number
  title: string
  artist: string
  date: string
  medium: string
  origin: string
  classification: string
  imageUrl: string | null
  imageAlt: string
  description?: string
  sourceUrl: string
}

export interface ArtworkPage {
  items: Artwork[]
  page: number
  totalPages: number
}
