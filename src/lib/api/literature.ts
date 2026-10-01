import type { LiteraryWork, LiteraturePage } from "../../types/literature"

const API = "https://openlibrary.org"
const FIELDS = [
  "key",
  "title",
  "author_name",
  "first_sentence",
  "subject",
  "language",
  "cover_i",
].join(",")

interface OpenLibrarySearchRecord {
  key: string
  title: string
  author_name?: string[]
  first_sentence?: string[]
  subject?: string[]
  language?: string[]
  cover_i?: number
}

function normalize(book: OpenLibrarySearchRecord): LiteraryWork {
  return {
    id: book.key.split("/").pop() || book.key,
    title: book.title,
    authors: (book.author_name || []).map((name) => ({ name, years: "" })),
    summary: book.first_sentence?.[0] || "",
    subjects: book.subject || [],
    languages: book.language || [],
    coverUrl: book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg?default=false`
      : null,
    readUrl: `${API}${book.key}`,
  }
}

async function request(url: string, signal?: AbortSignal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error("The reading room could not be reached.")
  return response.json()
}

export async function getLiterature(
  query = "",
  page = 1,
  signal?: AbortSignal,
): Promise<LiteraturePage> {
  const params = new URLSearchParams({
    q: query || "subject:fiction",
    page: String(page),
    limit: "20",
    fields: FIELDS,
  })
  const data = await request(`${API}/search.json?${params}`, signal)
  return {
    items: (data.docs as OpenLibrarySearchRecord[]).map(normalize),
    nextPage: page * 20 < data.numFound ? page + 1 : null,
  }
}

export async function getLiteraryWork(
  id: string,
  signal?: AbortSignal,
): Promise<LiteraryWork> {
  const work = await request(`${API}/works/${id}.json`, signal)
  const authors = await Promise.all(
    (work.authors || []).map(
      async (entry: { author?: { key?: string } }) => {
        const key = entry.author?.key
        if (!key) return null
        try {
          const author = await request(`${API}${key}.json`, signal)
          return { name: author.name as string, years: "" }
        } catch {
          return null
        }
      },
    ),
  )
  const description =
    typeof work.description === "string"
      ? work.description
      : work.description?.value || ""
  const coverId = work.covers?.find((cover: number) => cover > 0)
  return {
    id,
    title: work.title || "Untitled",
    authors: authors.filter(
      (author): author is { name: string; years: string } => Boolean(author?.name),
    ),
    summary: description,
    subjects: work.subjects || [],
    languages: (work.languages || []).map((language: { key: string }) =>
      language.key.split("/").pop() || "",
    ),
    coverUrl: coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg?default=false`
      : null,
    readUrl: `${API}/works/${id}`,
  }
}
