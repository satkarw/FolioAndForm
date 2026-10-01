const API = "https://en.wikisource.org/w/api.php"

export interface PoemResult {
  title: string
  snippet: string
  pageId: number
}

export interface PoemTextPage {
  title: string
  paragraphs: string[]
  chapters: Array<{ title: string; label: string }>
  sourceUrl: string
}

async function requestSearch(query: string, signal?: AbortSignal) {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    srnamespace: "0",
    srlimit: "16",
    format: "json",
    origin: "*",
  })
  const response = await fetch(`${API}?${params}`, { signal })
  if (!response.ok) throw new Error("The poetry collection could not be reached.")
  const data = await response.json()
  return (data.query?.search || []) as Array<{
    title: string
    snippet: string
    pageid: number
  }>
}

function normalizeResults(results: Array<{
  title: string
  snippet: string
  pageid: number
}>): PoemResult[] {
  return results
    .filter(
      (result) =>
        !/(?:encyclop|dictionary|biograph|persons and places|^the earliest lives|\/(?:preface|notes|appendix)(?:$|\/))/i.test(
          result.title,
        ),
    )
    .map((result) => ({
      title: result.title,
      snippet: result.snippet,
      pageId: result.pageid,
    }))
}

export async function searchPoems(
  query: string,
  signal?: AbortSignal,
): Promise<PoemResult[]> {
  const poems = await requestSearch(`${query} incategory:Poems`, signal)
  if (poems.length) return normalizeResults(poems)
  return normalizeResults(await requestSearch(query, signal))
}

async function requestPoemPage(title: string, signal?: AbortSignal) {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "displaytitle|text",
    format: "json",
    origin: "*",
  })
  const response = await fetch(`${API}?${params}`, { signal })
  if (!response.ok) throw new Error("This poem could not be reached.")
  const data = await response.json()
  if (data.error || !data.parse?.text?.["*"]) {
    throw new Error("This text is not available in the source catalogue.")
  }
  return data.parse as {
    title: string
    text: { "*": string }
  }
}

function extractPoemPage(
  page: { title: string; text: { "*": string } },
  workPage: { title: string; text: { "*": string } },
): PoemTextPage {
  const document = new DOMParser().parseFromString(page.text["*"], "text/html")
  const content = document.querySelector(".mw-parser-output")
  if (!content) throw new Error("The source page has no readable text.")

  const workDocument = workPage === page
    ? document
    : new DOMParser().parseFromString(workPage.text["*"], "text/html")
  const workContent = workDocument.querySelector(".mw-parser-output")
  const workPath = `/wiki/${encodeURIComponent(workPage.title.replaceAll(" ", "_"))}`
  const chapters = new Map<string, { title: string; label: string }>()
  for (const link of workContent?.querySelectorAll<HTMLAnchorElement>('a[href^="/wiki/"]') || []) {
    const href = link.getAttribute("href") || ""
    if (!href.startsWith(`${workPath}/`)) continue
    const title = decodeURIComponent(href.slice("/wiki/".length)).replaceAll("_", " ")
    if (!/(?:book|rune|canto|chapter)\s|\/(?:book|rune|canto|chapter)\s/i.test(title)) continue
    chapters.set(title, { title, label: link.textContent?.trim() || title.split("/").pop() || title })
  }

  content
    .querySelectorAll(
      "style, script, table, .ws-noexport, .mw-editsection, .reference, .reflist, .navbox, .metadata, .licenseContainer, .ws-header, .wst-header, .toc, .catlinks, .mw-cite-backlink",
    )
    .forEach((element) => element.remove())

  const paragraphs = [...content.querySelectorAll("h1, h2, h3, h4, p, blockquote, .poem")]
    .filter((element) => !element.parentElement?.closest(".poem"))
    .map((element) => (element as HTMLElement).innerText?.trim() || element.textContent?.trim() || "")
    .filter((text) => text && !/^Layout\s+\d+$/i.test(text))

  return {
    title: page.title,
    paragraphs,
    chapters: [...chapters.values()],
    sourceUrl: poemSourceUrl(page.title),
  }
}

export async function getPoemText(
  workTitle: string,
  pageTitle: string,
  signal?: AbortSignal,
): Promise<PoemTextPage> {
  const [page, work] = await Promise.all([
    requestPoemPage(pageTitle, signal),
    workTitle === pageTitle ? Promise.resolve(null) : requestPoemPage(workTitle, signal),
  ])
  return extractPoemPage(page, work || page)
}

export function poemSourceUrl(title: string): string {
  return `https://en.wikisource.org/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`
}
