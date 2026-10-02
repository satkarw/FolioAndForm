import { useState, type ReactNode } from "react"
import { Link } from "./ui"

export default function Shell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="site">
      <header className="site-header">
        <Link
          href="/"
          className="wordmark"
          onNavigate={() => setMenuOpen(false)}
        >
          Folio <i>&</i> Form
        </Link>
        <button
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
        <nav
          id="primary-navigation"
          className={menuOpen ? "nav-open" : ""}
          aria-label="Primary"
        >
          <Link href="/art" onNavigate={() => setMenuOpen(false)}>
            Art
          </Link>
          <Link href="/literature" onNavigate={() => setMenuOpen(false)}>
            Literature
          </Link>
          <Link href="/poems" onNavigate={() => setMenuOpen(false)}>
            Poems
          </Link>
          <Link href="/about" onNavigate={() => setMenuOpen(false)}>
            About
          </Link>
          <Link
            href="/search"
            className="search-link"
            onNavigate={() => setMenuOpen(false)}
          >
            Search <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      </header>
      <main>{children}</main>
      <footer>
        <div>
          <p className="wordmark">
            Folio <i>&</i> Form
          </p>
          <p>A quiet index of art, books, and poems.</p>
        </div>
        <div className="footer-sources">
          <span>Collections drawn from</span>
          <a href="https://www.clevelandart.org/" target="_blank" rel="noreferrer">
            Cleveland Museum of Art
          </a>
          <a href="https://openlibrary.org/" target="_blank" rel="noreferrer">
            Open Library
          </a>
          <a href="https://en.wikisource.org/" target="_blank" rel="noreferrer">
            Wikisource
          </a>
        </div>
        <p className="footer-note">Open collections, thoughtfully arranged.</p>
      </footer>
    </div>
  )
}
