import test, { beforeEach, describe } from "node:test"
import * as path from "./path"
import assert from "node:assert"
import { FullSlug, TransformOptions } from "./path"
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkStringify from "remark-stringify";
import { RecipeSections, insertSections } from "../plugins/transformers/recipe-sections";
import { BuildCtx } from "./ctx";
import {rehype} from 'rehype'
// import {remark} from 'remark'

describe("recipe sections", () => {
  test("should div ingredients and method when no trailing heading", async () => {

    const file = await rehype()
      .data('settings', {fragment: true})
      .use(RecipeSections().htmlPlugins!({} as BuildCtx))
      .process(
        [
          '<article>',
            '<h2>Ingredients</h2>',
            '<ul>',
              '<li>Item</li>',
            '</ul>',
            '<h2>Method</h2>',
            '<ol>',
              '<li>Add the butter</li>',
            '</ol>',
          '</article>'
        ].join('')
      )

    assert.equal(
      String(file),
      [
        '<article>',
          '<h2 id="ingredients">Ingredients</h2>',
          '<div>',
            '<ul>',
              '<li>Item</li>',
            '</ul>',
          '</div>',
          '<h2 id="method">Method</h2>',
          '<div>',
            '<ol>',
              '<li>Add the butter</li>',
            '</ol>',
          '</div>',
        '</article>'
      ].join('')
    )
  });

  test("should div ingredients and method with trailing heading", async () => {
    const file = await rehype()
      .data('settings', {fragment: true})
      .use(RecipeSections().htmlPlugins!({} as BuildCtx))
      .process(
        [
          '<article>',
          '<h2>Ingredients</h2>',
          '<ul>',
          '<li>Item</li>',
          '</ul>',
          '<h2>Method</h2>',
          '<ol>',
          '<li>Add the butter</li>',
          '</ol>',
          '<h2>Notes</h2>',
          '</article>'
        ].join('')
      )

    assert.equal(
      String(file),
      [
        '<article>',
        '<h2 id="ingredients">Ingredients</h2>',
        '<div>',
        '<ul>',
        '<li>Item</li>',
        '</ul>',
        '</div>',
        '<h2 id="method">Method</h2>',
        '<div>',
        '<ol>',
        '<li>Add the butter</li>',
        '</ol>',
        '</div>',
        '<h2 id="notes">Notes</h2>',
        '</article>'
      ].join('')
    )
  });

  test("should div ingredients and method which contain a heading", async () => {
    const file = await rehype()
      .data('settings', {fragment: true})
      .use(RecipeSections().htmlPlugins!({} as BuildCtx))
      .process(
        [
          '<article>',
            '<h2>Ingredients</h2>',
            '<ul>',
              '<li>Item</li>',
            '</ul>',
            '<h3>Sub ingredients</h3>',
            '<ul>',
              '<li>SubItem</li>',
            '</ul>',
            '<h2>Method</h2>',
            '<ol>',
              '<li>Add the butter</li>',
            '</ol>',
            '<h3>Sub Steps</h3>',
            '<ol>',
              '<li>Add the sub-butter</li>',
            '</ol>',
          '</article>'
        ].join('')
      )

    assert.equal(
      String(file),
      [
        '<article>',
          '<h2 id="ingredients">Ingredients</h2>',
          '<div>',
            '<ul>',
              '<li>Item</li>',
            '</ul>',
            '<h3 id="sub-ingredients">Sub ingredients</h3>',
            '<ul>',
              '<li>SubItem</li>',
            '</ul>',
          '</div>',
          '<h2 id="method">Method</h2>',
          '<div>',
            '<ol>',
              '<li>Add the butter</li>',
            '</ol>',
            '<h3 id="sub-steps">Sub Steps</h3>',
            '<ol>',
              '<li>Add the sub-butter</li>',
            '</ol>',
          '</div>',
        '</article>'
      ].join('')
    )
  });

  test("should normalize headers", async () => {

    const file = await unified()
    .use(remarkParse)
    .use(RecipeSections().markdownPlugins!({} as BuildCtx))
    .use(remarkStringify)
    .process(
      [
        '# Ingredients\n',
        '\n',
        'hello\n',
        '\n',
        '##### Method\n',
        '\n',
        'step\n'
      ].join('')
    )

  assert.equal(
    String(file),
    [
      '## Ingredients\n',
      '\n',
      'hello\n',
      '\n',
      '### Method\n',
      '\n',
      'step\n'
    ].join('')
  )
  });
});

describe("typeguards", () => {
  test("isSimpleSlug", () => {
    assert(path.isSimpleSlug(""))
    assert(path.isSimpleSlug("abc"))
    assert(path.isSimpleSlug("abc/"))
    assert(path.isSimpleSlug("notindex"))
    assert(path.isSimpleSlug("notindex/def"))

    assert(!path.isSimpleSlug("//"))
    assert(!path.isSimpleSlug("index"))
    assert(!path.isSimpleSlug("https://example.com"))
    assert(!path.isSimpleSlug("/abc"))
    assert(!path.isSimpleSlug("abc/index"))
    assert(!path.isSimpleSlug("abc#anchor"))
    assert(!path.isSimpleSlug("abc?query=1"))
    assert(!path.isSimpleSlug("index.md"))
    assert(!path.isSimpleSlug("index.html"))
  })

  test("isRelativeURL", () => {
    assert(path.isRelativeURL("."))
    assert(path.isRelativeURL(".."))
    assert(path.isRelativeURL("./abc/def"))
    assert(path.isRelativeURL("./abc/def#an-anchor"))
    assert(path.isRelativeURL("./abc/def?query=1#an-anchor"))
    assert(path.isRelativeURL("../abc/def"))
    assert(path.isRelativeURL("./abc/def.pdf"))

    assert(!path.isRelativeURL("abc"))
    assert(!path.isRelativeURL("/abc/def"))
    assert(!path.isRelativeURL(""))
    assert(!path.isRelativeURL("./abc/def.html"))
    assert(!path.isRelativeURL("./abc/def.md"))
  })

  test("isFullSlug", () => {
    assert(path.isFullSlug("index"))
    assert(path.isFullSlug("abc/def"))
    assert(path.isFullSlug("html.energy"))
    assert(path.isFullSlug("test.pdf"))

    assert(!path.isFullSlug("."))
    assert(!path.isFullSlug("./abc/def"))
    assert(!path.isFullSlug("../abc/def"))
    assert(!path.isFullSlug("abc/def#anchor"))
    assert(!path.isFullSlug("abc/def?query=1"))
    assert(!path.isFullSlug("note with spaces"))
  })

  test("isFilePath", () => {
    assert(path.isFilePath("content/index.md"))
    assert(path.isFilePath("content/test.png"))
    assert(!path.isFilePath("../test.pdf"))
    assert(!path.isFilePath("content/test"))
    assert(!path.isFilePath("./content/test"))
  })
})

describe("transforms", () => {
  function asserts<Inp, Out>(
    pairs: [string, string][],
    transform: (inp: Inp) => Out,
    checkPre: (x: any) => x is Inp,
    checkPost: (x: any) => x is Out,
  ) {
    for (const [inp, expected] of pairs) {
      assert(checkPre(inp), `${inp} wasn't the expected input type`)
      const actual = transform(inp)
      assert.strictEqual(
        actual,
        expected,
        `after transforming ${inp}, '${actual}' was not '${expected}'`,
      )
      assert(checkPost(actual), `${actual} wasn't the expected output type`)
    }
  }

  test("simplifySlug", () => {
    asserts(
      [
        ["index", "/"],
        ["abc", "abc"],
        ["abc/index", "abc/"],
        ["abc/def", "abc/def"],
      ],
      path.simplifySlug,
      path.isFullSlug,
      path.isSimpleSlug,
    )
  })

  test("slugifyFilePath", () => {
    asserts(
      [
        ["content/index.md", "content/index"],
        ["content/index.html", "content/index"],
        ["content/_index.md", "content/index"],
        ["/content/index.md", "content/index"],
        ["content/cool.png", "content/cool.png"],
        ["index.md", "index"],
        ["test.mp4", "test.mp4"],
        ["note with spaces.md", "note-with-spaces"],
        ["notes.with.dots.md", "notes.with.dots"],
        ["test/special chars?.md", "test/special-chars-q"],
        ["test/special chars #3.md", "test/special-chars-3"],
      ],
      path.slugifyFilePath,
      path.isFilePath,
      path.isFullSlug,
    )
  })

  test("transformInternalLink", () => {
    asserts(
      [
        ["", "."],
        [".", "."],
        ["./", "./"],
        ["./index", "./"],
        ["./index#abc", "./#abc"],
        ["./index.html", "./"],
        ["./index.md", "./"],
        ["./index.css", "./index.css"],
        ["content", "./content"],
        ["content/test.md", "./content/test"],
        ["content/test.pdf", "./content/test.pdf"],
        ["./content/test.md", "./content/test"],
        ["../content/test.md", "../content/test"],
        ["tags/", "./tags/"],
        ["/tags/", "./tags/"],
        ["content/with spaces", "./content/with-spaces"],
        ["content/with spaces/index", "./content/with-spaces/"],
        ["content/with spaces#and Anchor!", "./content/with-spaces#and-anchor"],
      ],
      path.transformInternalLink,
      (_x: string): _x is string => true,
      path.isRelativeURL,
    )
  })

  test("pathToRoot", () => {
    asserts(
      [
        ["index", "."],
        ["abc", "."],
        ["abc/def", ".."],
        ["abc/def/ghi", "../.."],
        ["abc/def/index", "../.."],
      ],
      path.pathToRoot,
      path.isFullSlug,
      path.isRelativeURL,
    )
  })
})

describe("link strategies", () => {
  const allSlugs = [
    "a/b/c",
    "a/b/d",
    "a/b/index",
    "e/f",
    "e/g/h",
    "index",
    "a/test.png",
  ] as FullSlug[]

  describe("absolute", () => {
    const opts: TransformOptions = {
      strategy: "absolute",
      allSlugs,
    }

    test("from a/b/c", () => {
      const cur = "a/b/c" as FullSlug
      assert.strictEqual(path.transformLink(cur, "a/b/d", opts), "../../a/b/d")
      assert.strictEqual(path.transformLink(cur, "a/b/index", opts), "../../a/b/")
      assert.strictEqual(path.transformLink(cur, "e/f", opts), "../../e/f")
      assert.strictEqual(path.transformLink(cur, "e/g/h", opts), "../../e/g/h")
      assert.strictEqual(path.transformLink(cur, "index", opts), "../../")
      assert.strictEqual(path.transformLink(cur, "index.png", opts), "../../index.png")
      assert.strictEqual(path.transformLink(cur, "index#abc", opts), "../../#abc")
      assert.strictEqual(path.transformLink(cur, "tag/test", opts), "../../tag/test")
      assert.strictEqual(path.transformLink(cur, "a/b/c#test", opts), "../../a/b/c#test")
      assert.strictEqual(path.transformLink(cur, "a/test.png", opts), "../../a/test.png")
    })

    test("from a/b/index", () => {
      const cur = "a/b/index" as FullSlug
      assert.strictEqual(path.transformLink(cur, "a/b/d", opts), "../../a/b/d")
      assert.strictEqual(path.transformLink(cur, "a/b", opts), "../../a/b")
      assert.strictEqual(path.transformLink(cur, "index", opts), "../../")
    })

    test("from index", () => {
      const cur = "index" as FullSlug
      assert.strictEqual(path.transformLink(cur, "index", opts), "./")
      assert.strictEqual(path.transformLink(cur, "a/b/c", opts), "./a/b/c")
      assert.strictEqual(path.transformLink(cur, "a/b/index", opts), "./a/b/")
    })
  })

  describe("shortest", () => {
    const opts: TransformOptions = {
      strategy: "shortest",
      allSlugs,
    }

    test("from a/b/c", () => {
      const cur = "a/b/c" as FullSlug
      assert.strictEqual(path.transformLink(cur, "d", opts), "../../a/b/d")
      assert.strictEqual(path.transformLink(cur, "h", opts), "../../e/g/h")
      assert.strictEqual(path.transformLink(cur, "a/b/index", opts), "../../a/b/")
      assert.strictEqual(path.transformLink(cur, "a/b/index.png", opts), "../../a/b/index.png")
      assert.strictEqual(path.transformLink(cur, "a/b/index#abc", opts), "../../a/b/#abc")
      assert.strictEqual(path.transformLink(cur, "index", opts), "../../")
      assert.strictEqual(path.transformLink(cur, "index.png", opts), "../../index.png")
      assert.strictEqual(path.transformLink(cur, "test.png", opts), "../../a/test.png")
      assert.strictEqual(path.transformLink(cur, "index#abc", opts), "../../#abc")
    })

    test("from a/b/index", () => {
      const cur = "a/b/index" as FullSlug
      assert.strictEqual(path.transformLink(cur, "d", opts), "../../a/b/d")
      assert.strictEqual(path.transformLink(cur, "h", opts), "../../e/g/h")
      assert.strictEqual(path.transformLink(cur, "a/b/index", opts), "../../a/b/")
      assert.strictEqual(path.transformLink(cur, "index", opts), "../../")
    })

    test("from index", () => {
      const cur = "index" as FullSlug
      assert.strictEqual(path.transformLink(cur, "d", opts), "./a/b/d")
      assert.strictEqual(path.transformLink(cur, "h", opts), "./e/g/h")
      assert.strictEqual(path.transformLink(cur, "a/b/index", opts), "./a/b/")
      assert.strictEqual(path.transformLink(cur, "index", opts), "./")
    })
  })

  describe("relative", () => {
    const opts: TransformOptions = {
      strategy: "relative",
      allSlugs,
    }

    test("from a/b/c", () => {
      const cur = "a/b/c" as FullSlug
      assert.strictEqual(path.transformLink(cur, "d", opts), "./d")
      assert.strictEqual(path.transformLink(cur, "index", opts), "./")
      assert.strictEqual(path.transformLink(cur, "../../../index", opts), "../../../")
      assert.strictEqual(path.transformLink(cur, "../../../index.png", opts), "../../../index.png")
      assert.strictEqual(path.transformLink(cur, "../../../index#abc", opts), "../../../#abc")
      assert.strictEqual(path.transformLink(cur, "../../../", opts), "../../../")
      assert.strictEqual(
        path.transformLink(cur, "../../../a/test.png", opts),
        "../../../a/test.png",
      )
      assert.strictEqual(path.transformLink(cur, "../../../e/g/h", opts), "../../../e/g/h")
      assert.strictEqual(path.transformLink(cur, "../../../e/g/h", opts), "../../../e/g/h")
      assert.strictEqual(path.transformLink(cur, "../../../e/g/h#abc", opts), "../../../e/g/h#abc")
    })

    test("from a/b/index", () => {
      const cur = "a/b/index" as FullSlug
      assert.strictEqual(path.transformLink(cur, "../../index", opts), "../../")
      assert.strictEqual(path.transformLink(cur, "../../", opts), "../../")
      assert.strictEqual(path.transformLink(cur, "../../e/g/h", opts), "../../e/g/h")
      assert.strictEqual(path.transformLink(cur, "c", opts), "./c")
    })

    test("from index", () => {
      const cur = "index" as FullSlug
      assert.strictEqual(path.transformLink(cur, "e/g/h", opts), "./e/g/h")
      assert.strictEqual(path.transformLink(cur, "a/b/index", opts), "./a/b/")
    })
  })
})
