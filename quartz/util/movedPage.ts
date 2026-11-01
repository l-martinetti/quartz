/** Recover a moved note only when its folder and filename identify one page. */
export function findMovedPage(pathname: string, slugs: string[]): string | undefined {
  const [requested, ...normalized] = [pathname, ...slugs].map((value) => {
    try {
      value = decodeURIComponent(value)
    } catch {
      return []
    }
    return value
      .replace(/\.html$/, "")
      .replace(/\/$/, "")
      .replace(/\/index$/, "")
      .split("/")
      .filter(Boolean)
      .map((part) => part.toLowerCase().replace(/^\d+[._-]+/, ""))
  })
  const exact = slugs.filter((_, i) => normalized[i].join("/") === requested.join("/"))
  if (exact.length === 1) return exact[0]
  if (requested.length < 2) return undefined
  const suffix = requested.slice(-2).join("/")
  const matches = slugs.filter((_, i) => normalized[i].slice(-2).join("/") === suffix)
  return matches.length === 1 ? matches[0] : undefined
}
