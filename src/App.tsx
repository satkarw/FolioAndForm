import { useEffect, useState } from "react"
import Shell from "./components/Shell"
import {
  AboutPage,
  ArtPage,
  ArtworkDetailPage,
  BookDetailPage,
  HomePage,
  LiteraturePage,
  PoemsPage,
  PoemReaderPage,
  SearchPage,
} from "./pages"

function Route() {
  const path = window.location.pathname
  const artwork = path.match(/^\/art\/(\d+)$/)
  const book = path.match(/^\/literature\/([A-Za-z0-9]+)$/)
  if (artwork) return <ArtworkDetailPage id={artwork[1]} />
  if (book) return <BookDetailPage id={book[1]} />
  if (path === "/art") return <ArtPage />
  if (path === "/literature") return <LiteraturePage />
  if (path === "/poems") return <PoemsPage />
  if (path === "/poems/read") {
    const params = new URLSearchParams(window.location.search)
    return (
      <PoemReaderPage
        work={params.get("work") || ""}
        page={params.get("page") || ""}
      />
    )
  }
  if (path === "/search") return <SearchPage />
  if (path === "/about") return <AboutPage />
  return <HomePage />
}

export default function App() {
  const [, rerender] = useState(0)
  useEffect(() => {
    const onRoute = () => rerender((value) => value + 1)
    window.addEventListener("popstate", onRoute)
    return () => window.removeEventListener("popstate", onRoute)
  }, [])
  return (
    <Shell>
      <Route />
    </Shell>
  )
}
