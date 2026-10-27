import { QuartzPluginData } from "../plugins/vfile"
import { FullSlug, resolveRelative, simplifySlug } from "./path"

// These are presentation groups; the underlying note paths stay independent.
export const navigationSections = [
  { id: "campagna", title: "La campagna", roots: ["campagna"] },
  { id: "luoghi", title: "Luoghi", roots: ["luoghi", "vorsundeth"] },
  { id: "persone", title: "Personaggi e fazioni", roots: ["personaggi", "istituzioni"] },
  { id: "sessioni", title: "Sessioni", roots: ["sessioni"] },
  { id: "scoperte", title: "Scoperte e documenti", roots: ["conoscenze"] },
  { id: "fonti", title: "Fonti e riferimenti", roots: ["fonti"] },
]

export function navigationFiles(files: QuartzPluginData[]) {
  return files.filter(
    (file) =>
      file.slug &&
      file.frontmatter &&
      file.unlisted !== true &&
      file.slug !== "404" &&
      file.slug !== "tags/index" &&
      !file.slug.startsWith("tags/"),
  )
}

export function navigationSlug(slug: string) {
  return simplifySlug(slug.split("#")[0] as FullSlug).replace(/\/$/, "")
}

export function navigationHref(current: FullSlug, target: string) {
  return resolveRelative(current, target as FullSlug)
}
