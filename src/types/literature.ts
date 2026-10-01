export interface Author {
  name: string
  years: string
}

export interface LiteraryWork {
  id: string
  title: string
  authors: Author[]
  summary: string
  subjects: string[]
  languages: string[]
  coverUrl: string | null
  readUrl: string | null
}

export interface LiteraturePage {
  items: LiteraryWork[]
  nextPage: number | null
}
