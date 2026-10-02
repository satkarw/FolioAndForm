import { useState, type ReactNode } from "react"
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
  onUnavailable,
}: {
  artwork: Artwork
  eager?: boolean
  onUnavailable?: () => void
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  if (!artwork.imageUrl || failedUrl === artwork.imageUrl) return null
  return (
    <img
      src={artwork.imageUrl}
      alt={artwork.imageAlt}
      loading={eager ? "eager" : "lazy"}
      onError={() => {
        setFailedUrl(artwork.imageUrl)
        onUnavailable?.()
      }}
    />
  )
}

export function ArtworkTile({
  artwork,
  index,
  onUnavailable,
}: {
  artwork: Artwork
  index: number
  onUnavailable?: () => void
}) {
  const [unavailable, setUnavailable] = useState(false)
  if (!artwork.imageUrl || unavailable) return null
  return (
    <article className={`art-tile art-tile-${(index % 5) + 1}`}>
      <Link href={`/art/${artwork.id}`} className="art-image-link">
        <ArtworkImage
          artwork={artwork}
          onUnavailable={() => {
            setUnavailable(true)
            onUnavailable?.()
          }}
        />
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
