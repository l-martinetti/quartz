import { QuartzComponent, QuartzComponentConstructor } from "./types"
import { BuildTimeTrieData } from "../util/ctx"
import { FileTrieNode } from "../util/fileTrie"
import {
  navigationFiles,
  navigationHref,
  navigationSlug,
  navigationTree,
} from "../util/siteNavigation"
// @ts-ignore: Quartz bundles browser scripts imported with the .inline suffix.
import script from "./scripts/siteNavigation.inline"

export const CampaignNavigation: QuartzComponentConstructor = () => {
  const Navigation: QuartzComponent = ({ allFiles, fileData }) => {
    const current = fileData.slug!
    const currentPath = navigationSlug(current)
    const files = navigationFiles(allFiles)
    const tree = navigationTree(files)

    const link = (slug: string, title: string, folder = false) => (
      <a
        href={navigationHref(current, slug)}
        class={folder ? "internal campaign-folder-link" : "internal"}
        data-no-popover="true"
        aria-current={navigationSlug(slug) === currentPath ? "page" : undefined}
      >
        {title}
      </a>
    )

    const renderNode = (node: FileTrieNode<BuildTimeTrieData>, root = false) => {
      const path = navigationSlug(node.slug)
      const inBranch = currentPath === path || currentPath.startsWith(`${path}/`)
      if (!node.isFolder) return <li key={node.slug}>{link(node.slug, node.displayName)}</li>
      return (
        <li key={node.slug}>
          <details
            class={root ? "campaign-section" : undefined}
            data-nav-key={path}
            data-current-branch={inBranch}
            open={inBranch}
          >
            <summary aria-label={`Espandi o richiudi ${node.displayName}`}>
              {link(node.slug, node.displayName, true)}
            </summary>
            <ul>{node.children.map((child) => renderNode(child))}</ul>
          </details>
        </li>
      )
    }

    return (
      <nav class="campaign-nav" aria-label="Navigazione della wiki">
        <details class="campaign-menu" open>
          <summary>Esplora la wiki</summary>
          <div class="campaign-menu-content">
            <ul class="campaign-shortcuts" aria-label="Accessi rapidi">
              <li>{link("index", "Pagina iniziale")}</li>
            </ul>
            <ul class="campaign-sections">{tree.children.map((node) => renderNode(node, true))}</ul>
          </div>
        </details>
      </nav>
    )
  }
  Navigation.afterDOMLoaded = script
  return Navigation
}

export const PageOutline: QuartzComponentConstructor = () => {
  const Outline: QuartzComponent = ({ fileData }) => {
    const toc = fileData.toc ?? []
    if (toc.length < 3 || ((fileData.text?.length ?? 0) < 1200 && toc.length < 5)) return null
    return (
      <nav class="page-outline" aria-label="Indice della pagina">
        <details class="page-outline-panel" open>
          <summary>In questa pagina</summary>
          <ol>
            {toc.map((entry) => (
              <li key={entry.slug} style={`--outline-depth: ${Math.min(entry.depth, 2)}`}>
                <a href={`#${entry.slug}`}>{entry.text}</a>
              </li>
            ))}
          </ol>
        </details>
      </nav>
    )
  }
  Outline.afterDOMLoaded = script
  return Outline
}

export const RelatedNavigation: QuartzComponentConstructor = () => {
  const Related: QuartzComponent = ({ fileData, allFiles }) => {
    const current = fileData.slug!
    if (current === "index") return null
    const currentPath = navigationSlug(current)
    const files = navigationFiles(allFiles).filter((file) => file.slug !== current)
    const byPath = new Map(files.map((file) => [navigationSlug(file.slug!), file]))
    const outgoing = [...new Set((fileData.links ?? []).map(navigationSlug))]
      .map((slug) => byPath.get(slug))
      .filter((file) => file !== undefined)
      .filter((file) => navigationSlug(file.slug!) !== "")
      .slice(0, 6)
    const outgoingPaths = new Set(outgoing.map((file) => navigationSlug(file.slug!)))
    const incoming = files
      .filter(
        (file) =>
          file.slug !== "index" &&
          !outgoingPaths.has(navigationSlug(file.slug!)) &&
          file.links?.some((slug) => navigationSlug(slug) === currentPath),
      )
      .sort((a, b) => a.frontmatter!.title.localeCompare(b.frontmatter!.title, "it"))
      .slice(0, 3)
    const root = currentPath.includes("/") ? currentPath.split("/")[0] : undefined
    const parent = root ? byPath.get(root) : undefined
    if (!outgoing.length && !incoming.length && !parent) return null
    const list = (items: typeof outgoing) => (
      <ul>
        {items.map((file) => (
          <li key={file.slug}>
            <a class="internal" href={navigationHref(current, file.slug!)}>
              {file.frontmatter!.title}
            </a>
          </li>
        ))}
      </ul>
    )
    return (
      <nav class="related-navigation" aria-label="Collegamenti della pagina">
        <h2>Continua a esplorare</h2>
        <div class="related-navigation-groups">
          {outgoing.length > 0 && (
            <div>
              <h3>Citati in questa pagina</h3>
              {list(outgoing)}
            </div>
          )}
          {incoming.length > 0 && (
            <div>
              <h3>Pagine che rimandano qui</h3>
              {list(incoming)}
            </div>
          )}
        </div>
        {parent && (
          <a class="internal section-return" href={navigationHref(current, parent.slug!)}>
            Torna alla sezione: {parent.frontmatter!.title}
          </a>
        )}
      </nav>
    )
  }
  return Related
}
