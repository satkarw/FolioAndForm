import { useEffect, useState, type ReactNode } from "react"
import { getArtworkImageFallback } from "../lib/api/art"
import type { Artwork } from "../types/art"
import type { LiteraryWork } from "../types/literature"

export function Link({
  href,
  children,
  className = "",
  onNavigate,
}: {
  href: string
  children: ReactNode
  className?: string
  onNavigate?: () => void
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey) return
        event.preventDefault()
        window.history.pushState({}, "", href)
        window.dispatchEvent(new PopStateEvent("popstate"))
        window.scrollTo({ top: 0, behavior: "smooth" })
        onNavigate?.()
      }}
    >
      {children}
    </a>
  )
}

export function StateMessage({
  eyebrow,
  children,
  action,
}: {
  eyebrow: string
  children: ReactNode
  action?: () => void
}) {
  return (
    <div className="state-message" role="status">
      <span className="eyebrow">{eyebrow}</span>
      <p>{children}</p>
      {action && (
        <button className="text-button" onClick={action}>
          Try again
        </button>
      )}
    </div>
  )
}

export function ArtworkImage({
  artwork,
  eager = false,
}: {
  artwork: Artwork
  eager?: boolean
}) {
  const [failed, setFailed] = useState(!artwork.imageUrl)
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!failed) return
    const controller = new AbortController()
    getArtworkImageFallback(artwork, controller.signal)
      .then(setFallbackUrl)
      .catch(() => setFallbackUrl(null))
    return () => controller.abort()
  }, [artwork, failed])

  if (failed && !fallbackUrl) {
    return <div className="image-fallback">Image unavailable</div>
  }
  return (
    <img
      src={failed ? fallbackUrl || undefined : artwork.imageUrl || undefined}
      alt={artwork.imageAlt}
      loading={eager ? "eager" : "lazy"}
      onError={() => {
        if (failed) setFallbackUrl(null)
        else setFailed(true)
      }}
    />
  )
}

export function ArtworkTile({
  artwork,
  index,
}: {
  artwork: Artwork
  index: number
}) {
  return (
    <article className={`art-tile art-tile-${(index % 5) + 1}`}>
      <Link href={`/art/${artwork.id}`} className="art-image-link">
        <ArtworkImage artwork={artwork} />
      </Link>
      <div className="art-caption">
        <Link href={`/art/${artwork.id}`}>{artwork.title}</Link>
        <p>{artwork.artist}</p>
        <span>{artwork.date}</span>
      </div>
    </article>
  )
}

export function BookRow({
  book,
  number,
}: {
  book: LiteraryWork
  number: number
}) {
  return (
    <article className="book-row">
      <Link href={`/literature/${book.id}`} className="book-cover">
        {book.coverUrl && <img src={book.coverUrl} alt={`Cover of ${book.title}`} />}
      </Link>
      <span className="book-number">{String(number).padStart(2, "0")}</span>
      <div>
        <Link href={`/literature/${book.id}`} className="book-title">
          {book.title}
        </Link>
        <p>
          {book.authors.map((author) => author.name).join(", ") ||
            "Author unknown"}
        </p>
      </div>
      <span className="book-subject">
        {book.subjects[0]?.split(" -- ")[0] || "Literature"}
      </span>
      <span className="book-language">{book.languages[0]?.toUpperCase()}</span>
    </article>
  )
}
