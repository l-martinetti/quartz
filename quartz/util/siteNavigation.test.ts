import test from "node:test"
import assert from "node:assert/strict"
import { QuartzPluginData } from "../plugins/vfile"
import { FilePath, slugifyFilePath } from "./path"
import { navigationTree } from "./siteNavigation"

function note(path: string, title = "Titolo della pagina"): QuartzPluginData {
  return {
    slug: slugifyFilePath(path.replace(/\\/g, "/") as FilePath),
    relativePath: path as FilePath,
    filePath: `content/${path}` as FilePath,
    frontmatter: { title, tags: [] },
  }
}

test("vault folder numbers determine root order independently of index titles", () => {
  const tree = navigationTree([
    note("10. Archivio/index.md", "A"),
    note("3. Personaggi/index.md", "Z"),
    note("Fonti/index.md"),
    note("2. Sessioni/index.md", "Diario delle sessioni"),
    note("1. Campagna/index.md", "La campagna"),
  ])
  assert.deepEqual(
    tree.children.map((node) => node.displayName),
    ["Campagna", "Sessioni", "Personaggi", "Archivio", "Fonti"],
  )
  assert.equal(tree.children[0].slug, "1.-campagna/index")
})

test("new nested groups and folders without indexes follow the vault hierarchy", () => {
  const tree = navigationTree([
    note("8. Mondo/10 - Regioni/Nord.md"),
    note("8. Mondo/02 - Storia/Origini.md"),
    note("8. Mondo/03_Culti/Tempio.md"),
    note("8. Mondo/01. Geografia/Atlante.md"),
  ])
  assert.deepEqual(
    tree.children.map((node) => node.displayName),
    ["Mondo"],
  )
  const world = tree.children[0]
  assert.deepEqual(
    world.children.map((node) => node.displayName),
    ["Geografia", "Storia", "Culti", "Regioni"],
  )
  assert.equal(world.children[0].children.length, 1)
  assert.equal(world.children[0].slug, "8.-mondo/01.-geografia/index")
})

test("Windows source paths supply original names even without relativePath", () => {
  const file = note("2. Sessioni\\I Quattro dell'Arcobaleno\\Sessione 02.md")
  delete file.relativePath
  file.filePath = `C:\\vault\\${file.filePath}` as FilePath
  const tree = navigationTree([file])
  assert.equal(tree.children[0].displayName, "Sessioni")
  assert.equal(tree.children[0].children[0].displayName, "I Quattro dell'Arcobaleno")
})

test("renaming or moving folders replaces old groups and preserves file titles", () => {
  const before = navigationTree([note("1. Vecchio/NPC/Ada.md", "Ada, la guida")])
  const after = navigationTree([
    note("4. Nuovo gruppo/2. Alleati/Ada.md", "Ada, la guida"),
    note("4. Nuovo gruppo/1. Rivali/Bob.md", "Bob"),
    note("4. Nuovo gruppo/Introduzione.md", "Introduzione"),
  ])
  assert.equal(before.children[0].children[0].displayName, "NPC")
  assert.equal(after.children[0].displayName, "Nuovo gruppo")
  assert.deepEqual(
    after.children[0].children.map((node) => node.displayName),
    ["Rivali", "Alleati", "Introduzione"],
  )
  assert.equal(after.children[0].children[1].children[0].displayName, "Ada, la guida")
})

test("home, unlisted pages and generated tag pages do not create sections", () => {
  const tree = navigationTree([
    note("index.md", "Home"),
    note("1. Pubblico/index.md"),
    { ...note("2. Nascosto/Segreto.md"), unlisted: true },
    note("tags/prova.md"),
    note("404.md"),
  ])
  assert.deepEqual(
    tree.children.map((node) => node.displayName),
    ["Pubblico"],
  )
})

test("generated pages without a source path remain navigable", () => {
  const generated = note("1. Campagna/Generata.md", "Pagina generata")
  delete generated.filePath
  delete generated.relativePath
  const tree = navigationTree([generated])
  assert.equal(tree.children[0].children[0].displayName, "Pagina generata")
})

test("virtual folder paths do not replace original vault folder labels", () => {
  const source = note("2. Sessioni/01 - Cronache/Sessione 01.md")
  const virtual = note("2.-sessioni/01---cronache/index.md")
  delete virtual.filePath
  const tree = navigationTree([source, virtual])
  assert.equal(tree.children[0].displayName, "Sessioni")
  assert.equal(tree.children[0].children[0].displayName, "Cronache")
})
