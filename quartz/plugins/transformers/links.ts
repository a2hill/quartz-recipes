import { QuartzTransformerPlugin } from "../types"
import {
  FullSlug,
  RelativeURL,
  SimpleSlug,
  TransformOptions,
  _stripSlashes,
  simplifySlug,
  splitAnchor,
  transformLink,
} from "../../util/path"
import path from "path"
import { visit } from "unist-util-visit"
import isAbsoluteUrl from "is-absolute-url"

interface Options {
  /** How to resolve Markdown paths */
  markdownLinkResolution: TransformOptions["strategy"]
  /** Strips folders from a link so that it looks nice */
  prettyLinks: boolean
}

const defaultOptions: Options = {
  markdownLinkResolution: "absolute",
  prettyLinks: true,
}

export const CrawlLinks: QuartzTransformerPlugin<Partial<Options> | undefined> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "LinkProcessing",
    htmlPlugins(ctx) {
      return [
        () => {
          return (tree, file) => {
            const curSlug = simplifySlug(file.data.slug!)
            // File may contain links that are not present in the HTML AST tree (like frontmatter links)
            const outgoing: Set<SimpleSlug> = new Set(file.data.links)

            const transformOptions: TransformOptions = {
              strategy: opts.markdownLinkResolution,
              allSlugs: ctx.allSlugs,
            }

            visit(tree, "element", (node, _index, _parent) => {
              // rewrite all links
              if (
                node.tagName === "a" &&
                node.properties &&
                typeof node.properties.href === "string"
              ) {
                let dest = node.properties.href as RelativeURL
                node.properties.className ??= []
                node.properties.className.push(isAbsoluteUrl(dest) ? "external" : "internal")

                // don't process external links or intra-document anchors
                const isInternal = !(isAbsoluteUrl(dest) || dest.startsWith("#"))
                if (isInternal) {
                  dest = node.properties.href = transformLink(
                    file.data.slug!,
                    dest,
                    transformOptions,
                  )

                  // url.resolve is considered legacy
                  // WHATWG equivalent https://nodejs.dev/en/api/v18/url/#urlresolvefrom-to
                  const url = new URL(dest, `https://base.com/${curSlug}`)
                  const canonicalDest = url.pathname
                  const [destCanonical, _destAnchor] = splitAnchor(canonicalDest)

                  // need to decodeURIComponent here as WHATWG URL percent-encodes everything
                  const simple = decodeURIComponent(
                    simplifySlug(destCanonical as FullSlug),
                  ) as SimpleSlug
                  outgoing.add(simple)
                }

                // rewrite link internals if prettylinks is on
                if (
                  opts.prettyLinks &&
                  isInternal &&
                  node.children.length === 1 &&
                  node.children[0].type === "text" &&
                  !node.children[0].value.startsWith("#")
                ) {
                  node.children[0].value = path.basename(node.children[0].value)
                }
              }

              // transform all other resources that may use links
              if (
                ["img", "video", "audio", "iframe"].includes(node.tagName) &&
                node.properties &&
                typeof node.properties.src === "string"
              ) {
                if (!isAbsoluteUrl(node.properties.src)) {
                  let dest = node.properties.src as RelativeURL
                  dest = node.properties.src = transformLink(
                    file.data.slug!,
                    dest,
                    transformOptions,
                  )
                  node.properties.src = dest
                }
              }
            })

            file.data.links = [...outgoing]
          }
        },
      ]
    },
    markdownPlugins(ctx) {
      return [() => {
        // Add links from frontmatter
        // TODO: Should probably just look to see if there is a remark link plugin to do this
        return (_, file) => {
          const curSlug = simplifySlug(file.data.slug!)
          // Check to see if there are any existing links, just to be safe
          const outgoing: Set<SimpleSlug> = new Set(file.data.links)

          const transformOptions: TransformOptions = {
            strategy: opts.markdownLinkResolution,
            allSlugs: ctx.allSlugs,
          }
          const unprocessed: Set<string> = new Set();
          if (file.data.frontmatter?.up) {
            unprocessed.add(file.data.frontmatter.up)
          }
          if (file.data.frontmatter?.related) {
            file.data.frontmatter?.related.forEach((element: string) => {
              unprocessed.add(element);
            });
          }

          for(const linkName of unprocessed) {
            const dest = transformLink(
              file.data.slug!,
              linkName,
              transformOptions,
            )
            // url.resolve is considered legacy
            // WHATWG equivalent https://nodejs.dev/en/api/v18/url/#urlresolvefrom-to
            const url = new URL(dest, `https://base.com/${curSlug}`)
            const canonicalDest = url.pathname
            const [destCanonical, _destAnchor] = splitAnchor(canonicalDest)
  
            // need to decodeURIComponent here as WHATWG URL percent-encodes everything
            const simple = decodeURIComponent(
              simplifySlug(destCanonical as FullSlug)
            ) as SimpleSlug
            outgoing.add(simple);
          }

          file.data.links = [...outgoing];
        }
      }]
    },
  }
}

declare module "vfile" {
  interface DataMap {
    links: SimpleSlug[]
  }
}
