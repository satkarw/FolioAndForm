import { useEffect, useMemo, useState, type FormEvent } from "react"
import { getArtwork, getArtworks } from "./lib/api/art"
import { getLiteraryWork, getLiterature } from "./lib/api/literature"
import type { Artwork } from "./types/art"
import type { LiteraryWork } from "./types/literature"
import {
  ArtworkImage,
  ArtworkTile,
  BookRow,
  Link,
  StateMessage,
} from "./components/ui"

function useLoad<T>(loader: (signal: AbortSignal) => Promise<T>, key: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState("")
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setData(null)
    setError("")
    loader(controller.signal)
      .then(setData)
      .catch((reason) => {
        if (reason.name !== "AbortError")
          setError(reason.message || "Something went quiet.")
      })
    return () => controller.abort()
  }, [key, version])
  return { data, error, retry: () => setVersion((value) => value + 1) }
}

export function HomePage() {
  const art = useLoad(
    (signal) => getArtworks("impressionism", 1, 7, signal),
    "home-art",
  )
  const books = useLoad(
    (signal) => getLiterature("Virginia Woolf", 1, signal),
    "home-books",
  )
  const featured = art.data?.items[0]
  return (
    <>
      <section className="home-intro">
        <p className="issue-mark">
          A public reading room
          <br />
          No. 01 — 2025
        </p>
        <h1>
          Art to look at.
          <br />
          <em>Words to live with.</em>
        </h1>
        <p className="dek">
          Paintings and books, gathered from open collections and given room to
          breathe.
        </p>
        <span className="vertical-note">Scroll slowly</span>
      </section>

      <section className="featured-work">
        {featured ? (
          <>
            <div className="featured-image">
              <ArtworkImage artwork={featured} eager />
            </div>
            <div className="featured-copy">
              <span className="eyebrow">From the collection · I</span>
              <h2>{featured.title}</h2>
              <p className="artist-line">{featured.artist}</p>
              <p>
                {featured.date}. {featured.medium}. A work from the Art
                Institute of Chicago’s open collection.
              </p>
              <Link href={`/art/${featured.id}`} className="arrow-link">
                Look closely <span>→</span>
              </Link>
            </div>
          </>
        ) : art.error ? (
          <StateMessage eyebrow="Collection unavailable" action={art.retry}>
            {art.error}
          </StateMessage>
        ) : (
          <StateMessage eyebrow="Opening the archive">
            Finding a work worth lingering over…
          </StateMessage>
        )}
      </section>

      <section className="art-preview">
        <header className="section-heading">
          <div>
            <span className="eyebrow">The visual archive</span>
            <h2>Works to linger over</h2>
          </div>
          <Link href="/art" className="arrow-link">
            Enter the gallery <span>→</span>
          </Link>
        </header>
        <div className="preview-grid">
          {art.data?.items
            .slice(1, 5)
            .map((item, index) => (
              <ArtworkTile key={item.id} artwork={item} index={index} />
            ))}
        </div>
      </section>

      <section className="reading-feature">
        <div className="reading-title">
          <span className="eyebrow">The reading room</span>
          <h2>
            A book is a room
            <br />
            you carry with you.
          </h2>
        </div>
        <blockquote>
          “I ransack public libraries, and find them full of sunk treasure.”
        </blockquote>
        <div className="reading-list">
          {books.data?.items
            .slice(0, 3)
            .map((book, index) => (
              <BookRow key={book.id} book={book} number={index + 1} />
            ))}
          <Link href="/literature" className="arrow-link">
            Browse the shelves <span>→</span>
          </Link>
        </div>
      </section>
    </>
  )
}

export function ArtPage() {
  const [query, setQuery] = useState("")
  const [activeQuery, setActiveQuery] = useState("")
  const art = useLoad(
    (signal) => getArtworks(activeQuery, 1, 15, signal),
    `art-${activeQuery}`,
  )
  return (
    <section className="archive-page">
      <header className="archive-heading">
        <span className="eyebrow">
          Open collection · Art Institute of Chicago
        </span>
        <h1>The Gallery</h1>
        <p>Paintings from across centuries. Look without hurry.</p>
      </header>
      <form
        className="archive-search"
        onSubmit={(event) => {
          event.preventDefault()
          setActiveQuery(query)
        }}
      >
        <label htmlFor="art-query">Search by artist, place, or subject</label>
        <div>
          <input
            id="art-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try “Monet” or “Japan”"
          />
          <button>Search</button>
        </div>
      </form>
      {art.error ? (
        <StateMessage eyebrow="Collection unavailable" action={art.retry}>
          {art.error}
        </StateMessage>
      ) : !art.data ? (
        <StateMessage eyebrow="Consulting the catalogue">
          The gallery is being arranged…
        </StateMessage>
      ) : art.data.items.length === 0 ? (
        <StateMessage eyebrow="No works found">
          Try another artist, place, or subject.
        </StateMessage>
      ) : (
        <div className="gallery">
          {art.data.items.map((item, index) => (
            <ArtworkTile key={item.id} artwork={item} index={index} />
          ))}
        </div>
      )}
    </section>
  )
}

export function LiteraturePage() {
  const [query, setQuery] = useState("")
  const [activeQuery, setActiveQuery] = useState("")
  const books = useLoad(
    (signal) => getLiterature(activeQuery, 1, signal),
    `books-${activeQuery}`,
  )
  return (
    <section className="literature-page">
      <header className="archive-heading">
        <span className="eyebrow">
          Books and editions · Open Library
        </span>
        <h1>The Reading Room</h1>
        <p>Novels, essays, poems, and strange old volumes.</p>
      </header>
      <form
        className="archive-search literary-search"
        onSubmit={(event) => {
          event.preventDefault()
          setActiveQuery(query)
        }}
      >
        <label htmlFor="book-query">Find a book or author</label>
        <div>
          <input
            id="book-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try “Virginia Woolf”"
          />
          <button>Search</button>
        </div>
      </form>
      <div className="literature-index">
        <div className="index-note">
          <span>Index</span>
          <p>Books and editions gathered from the Open Library catalogue.</p>
        </div>
        <div>
          {books.error ? (
            <StateMessage
              eyebrow="Reading room unavailable"
              action={books.retry}
            >
              {books.error}
            </StateMessage>
          ) : !books.data ? (
            <StateMessage eyebrow="Opening the shelves">
              Locating the volumes…
            </StateMessage>
          ) : (
            books.data.items.map((book, index) => (
              <BookRow key={book.id} book={book} number={index + 1} />
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export function ArtworkDetailPage({ id }: { id: string }) {
  const art = useLoad((signal) => getArtwork(id, signal), `art-detail-${id}`)
  if (art.error)
    return (
      <StateMessage eyebrow="Artwork unavailable" action={art.retry}>
        {art.error}
      </StateMessage>
    )
  if (!art.data)
    return (
      <StateMessage eyebrow="Opening the catalogue">
        Bringing the work into view…
      </StateMessage>
    )
  const item = art.data
  return (
    <article className="art-detail">
      <Link href="/art" className="back-link">
        ← Return to gallery
      </Link>
      <div className="detail-image">
        <ArtworkImage artwork={item} eager />
      </div>
      <div className="detail-info">
        <span className="eyebrow">{item.classification}</span>
        <h1>{item.title}</h1>
        <p className="detail-artist">{item.artist}</p>
        <dl>
          <div>
            <dt>Date</dt>
            <dd>{item.date}</dd>
          </div>
          <div>
            <dt>Medium</dt>
            <dd>{item.medium}</dd>
          </div>
          <div>
            <dt>Origin</dt>
            <dd>{item.origin}</dd>
          </div>
          <div>
            <dt>Collection</dt>
            <dd>Art Institute of Chicago</dd>
          </div>
        </dl>
        {item.description && (
          <div
            className="description"
            dangerouslySetInnerHTML={{ __html: item.description }}
          />
        )}
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="arrow-link"
        >
          View institutional record <span>↗</span>
        </a>
      </div>
    </article>
  )
}

export function BookDetailPage({ id }: { id: string }) {
  const book = useLoad(
    (signal) => getLiteraryWork(id, signal),
    `book-detail-${id}`,
  )
  if (book.error)
    return (
      <StateMessage eyebrow="Volume unavailable" action={book.retry}>
        {book.error}
      </StateMessage>
    )
  if (!book.data)
    return (
      <StateMessage eyebrow="Opening the volume">
        Turning to the title page…
      </StateMessage>
    )
  const item = book.data
  return (
    <article className="book-detail">
      <Link href="/literature" className="back-link">
        ← Return to reading room
      </Link>
      <div className="book-jacket">
        {item.coverUrl ? (
          <img src={item.coverUrl} alt={`Cover of ${item.title}`} />
        ) : (
          <span>
            Open Library
            <br />
            {item.id}
          </span>
        )}
      </div>
      <div className="book-info">
        <span className="eyebrow">
          {item.subjects[0]?.split(" -- ")[0] || "Literature"}
        </span>
        <h1>{item.title}</h1>
        <p className="byline">
          {item.authors.map((author) => author.name).join(", ") ||
            "Author unknown"}
        </p>
        {item.summary && (
          <p className="book-summary">
            {item.summary.replace(
              " (This is an automatically generated summary.)",
              "",
            )}
          </p>
        )}
        <div className="book-meta">
          <span>
            Language · {item.languages.length ? item.languages.join(", ").toUpperCase() : "Not listed"}
          </span>
          <span>Open Library · {item.id}</span>
        </div>
        {item.readUrl && (
          <a
            href={item.readUrl}
            target="_blank"
            rel="noreferrer"
            className="read-button"
          >
            Open book record <span>↗</span>
          </a>
        )}
      </div>
    </article>
  )
}

export function SearchPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const [query, setQuery] = useState(params.get("q") || "")
  const [active, setActive] = useState(params.get("q") || "")
  const art = useLoad(
    (signal) =>
      active
        ? getArtworks(active, 1, 4, signal)
        : Promise.resolve({ items: [], page: 1, totalPages: 0 }),
    `search-art-${active}`,
  )
  const books = useLoad(
    (signal) =>
      active
        ? getLiterature(active, 1, signal)
        : Promise.resolve({ items: [], nextPage: null }),
    `search-books-${active}`,
  )
  function submit(event: FormEvent) {
    event.preventDefault()
    setActive(query)
    window.history.replaceState(
      {},
      "",
      `/search?q=${encodeURIComponent(query)}`,
    )
  }
  return (
    <section className="search-page">
      <span className="eyebrow">Search both collections</span>
      <h1>What are you looking for?</h1>
      <form onSubmit={submit}>
        <label className="sr-only" htmlFor="global-query">
          Search art and literature
        </label>
        <input
          autoFocus
          id="global-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Artist, author, title, or subject"
        />
        <button>Search</button>
      </form>
      {active && (
        <div className="search-results">
          <section>
            <header>
              <span>Art</span>
              <Link href={`/art`}>View gallery →</Link>
            </header>
            {art.data?.items.map((item, index) => (
              <ArtworkTile key={item.id} artwork={item} index={index} />
            ))}
          </section>
          <section>
            <header>
              <span>Literature</span>
              <Link href="/literature">View reading room →</Link>
            </header>
            {books.data?.items
              .slice(0, 5)
              .map((item, index) => (
                <BookRow key={item.id} book={item} number={index + 1} />
              ))}
          </section>
        </div>
      )}
    </section>
  )
}

export function AboutPage() {
  return (
    <section className="about-page">
      <span className="eyebrow">About this room</span>
      <h1>
        For looking.
        <br />
        <em>For reading.</em>
      </h1>
      <div>
        <p>
          Folio & Form brings two public collections into one quiet place:
          open-access art from the Art Institute of Chicago and books from Open
          Library.
        </p>
        <p>
          The arrangement is editorial; the works remain with the institutions
          that preserve and share them. No accounts, algorithms, or endless
          feeds. Only an invitation to linger.
        </p>
      </div>
    </section>
  )
}
