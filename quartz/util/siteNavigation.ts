import { QuartzPluginData } from "../plugins/vfile"
import { trieFromAllFiles } from "./ctx"
import { FullSlug, resolveRelative, simplifySlug } from "./path"

// Prefixes such as "1. ", "02 - " and "03_" control order without cluttering labels.
const folderOrderPrefix = /^\d+(?:[._-]\s*|\s+(?:[-–—]\s*)?)/

export function navigationTree(files: QuartzPluginData[]) {
  // Generated pages can have a slug and frontmatter but no source file path.
  // The trie needs a path to derive folder labels, so use the slug as fallback.
  const visible = navigationFiles(files).map((file) => ({
    ...file,
    filePath: file.filePath ?? file.relativePath ?? (file.slug as typeof file.filePath),
  }))
  const tree = trieFromAllFiles(visible)
  const folderNames = new Map<string, string>()
  for (const file of visible) {
    // Read the vault paths rather than index titles, which may describe the page
    // differently. Normalize separators for both Windows and POSIX builds.
    const sourcePath = file.relativePath ?? file.filePath
    if (!sourcePath) continue
    const segments = file.slug!.split("/")
    const names = sourcePath.replace(/\\/g, "/").split("/")
    for (let depth = 0; depth < segments.length - 1; depth++) {
      const name = names.at(depth - segments.length)
      const key = segments.slice(0, depth + 1).join("/")
      // Virtual folder pages follow source notes and carry slug-based paths.
      // Preserve the original vault spelling collected from those notes.
      if (name && !folderNames.has(key)) folderNames.set(key, name)
    }
  }

  const folderName = (slug: string, fallback: string) =>
    folderNames.get(navigationSlug(slug)) ?? fallback
  tree.sort((a, b) => {
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
    const aName = a.isFolder ? folderName(a.slug, a.slugSegment) : a.displayName
    const bName = b.isFolder ? folderName(b.slug, b.slugSegment) : b.displayName
    return aName.localeCompare(bName, "it", { numeric: true, sensitivity: "base" })
  })
  tree.map((node) => {
    if (node.isFolder && node !== tree) {
      const name = folderName(node.slug, node.displayName)
      node.displayName = name.replace(folderOrderPrefix, "") || name
    }
  })
  return tree
}

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
