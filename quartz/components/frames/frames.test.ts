import test, { describe } from "node:test"
import assert from "node:assert"
import { resolveFrame, frameRegistry } from "./index"
import { DefaultFrame } from "./DefaultFrame"
import { FullWidthFrame } from "./FullWidthFrame"
import { MinimalFrame } from "./MinimalFrame"
import type { PageFrame, PageFrameProps } from "./types"
import { h, Fragment } from "preact"
import { render } from "preact-render-to-string"
import { fromHtml } from "hast-util-from-html"
import { visit } from "unist-util-visit"
import type { Element } from "hast"

const customFrame: PageFrame = {
  name: "custom-test-frame",
  render: () => null as any,
}

describe("resolveFrame", () => {
  test("returns DefaultFrame for undefined", () => {
    assert.strictEqual(resolveFrame(undefined), DefaultFrame)
  })

  test("returns DefaultFrame for 'default'", () => {
    assert.strictEqual(resolveFrame("default"), DefaultFrame)
  })

  test("returns named built-in frame", () => {
    assert.strictEqual(resolveFrame("full-width"), FullWidthFrame)
  })

  test("returns DefaultFrame for unknown frame name", () => {
    assert.strictEqual(resolveFrame("nonexistent"), DefaultFrame)
  })

  test("plugin-registered frame takes priority", () => {
    frameRegistry.register("custom-test-frame", customFrame, "test-plugin")
    const result = resolveFrame("custom-test-frame")
    assert.strictEqual(result, customFrame)
  })

  test("returns DefaultFrame for unknown name even with plugin frames registered", () => {
    frameRegistry.register("custom-test-frame", customFrame, "test-plugin")
    const result = resolveFrame("totally-unknown")
    assert.strictEqual(result, DefaultFrame)
  })
})

describe("page body placement", () => {
  const bodies = {
    note: () => h("article", null, "Note body"),
    folder: () =>
      h(
        "div",
        { class: "popover-hint" },
        h("article", null, "Index body"),
        h("div", { class: "page-listing" }, "Child pages"),
      ),
    fragments: () => h(Fragment, null, h("article", null, "Body"), h("section", null, "Listing")),
  }

  for (const frame of [DefaultFrame, FullWidthFrame, MinimalFrame]) {
    for (const [name, body] of Object.entries(bodies)) {
      test(`${frame.name} keeps ${name} inside one main reading region`, () => {
        const props: PageFrameProps = {
          componentData: {} as PageFrameProps["componentData"],
          head: () => null,
          header: [],
          beforeBody: [],
          afterBody: [],
          left: [],
          right: [],
          footer: [],
          pageBody: body,
        }
        const tree = fromHtml(render(frame.render(props)), { fragment: true })
        const mains: Element[] = []
        visit(tree, "element", (node) => {
          if (node.tagName === "main") mains.push(node)
        })
        assert.strictEqual(mains.length, 1)
        assert.strictEqual(mains[0].properties.id, "page-content")
        assert.deepStrictEqual(mains[0].properties.className, ["page-body"])
        const articles: Element[] = []
        visit(mains[0], "element", (node) => {
          if (node.tagName === "article") articles.push(node)
        })
        assert.strictEqual(articles.length, 1)
        if (name === "folder") {
          const listings: Element[] = []
          visit(mains[0], "element", (node) => {
            if (node.properties.className?.includes("page-listing")) listings.push(node)
          })
          assert.strictEqual(listings.length, 1)
        }
      })
    }
  }
})
