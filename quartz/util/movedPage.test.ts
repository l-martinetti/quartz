import test from "node:test"
import assert from "node:assert/strict"
import { findMovedPage } from "./movedPage"

const corvus = "3.-personaggi/npc/i-quattro-dell’arcobaleno/vorsundeth/corvus"

test("old search results recover notes moved into numbered vault folders", () => {
  assert.equal(findMovedPage("personaggi/npc/vorsundeth/corvus", [corvus]), corvus)
  assert.equal(findMovedPage("Personaggi/NPC/Vorsundeth/Corvus.html", [corvus]), corvus)
  assert.equal(findMovedPage(encodeURI(corvus), [corvus]), corvus)
})

test("ambiguous and missing notes remain 404 pages", () => {
  assert.equal(
    findMovedPage("old/vorsundeth/corvus", [corvus, "other/vorsundeth/corvus"]),
    undefined,
  )
  assert.equal(findMovedPage("old/vorsundeth/unknown", [corvus]), undefined)
  assert.equal(findMovedPage("corvus", [corvus]), undefined)
  assert.equal(findMovedPage("%ZZ", [corvus]), undefined)
})
