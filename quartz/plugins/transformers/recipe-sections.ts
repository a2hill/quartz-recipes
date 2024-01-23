import { QuartzTransformerPlugin } from "../types";
import { ElementContent, Root } from "hast";
import { VFile } from "vfile";
import { BuildCtx } from "../../util/ctx";
import { CONTINUE, SKIP, visit } from "unist-util-visit";
import { Heading } from "mdast-util-to-hast/lib/handlers/heading";
import { Node, Element } from "hast"
import rehypeSlug from "rehype-slug";
import { boolean } from "yargs";

type HeadingDepth = 1|2|3|4|5|6;

/**
 * A mdast plugin that visits the headings in a tree and ensures that
 * * There is no h1 node (this will be done by the title), and ensures that there are no
 * heading gaps (h1 -> h3)
 */
function normalizeHeadings() {
    return (tree: Root, _: VFile) => {
        const depthSix = 6;
        let previousDepth = 1; // h1, the title of the page
        visit(tree, "heading", (node: Heading) => {
            // Only title is allowed to be h1
            if (node.depth === 1) {
                node.depth = 2;
            } else if (node.depth > previousDepth) {
                // if you go deeper, you can only go one deeper (up to 6)
                const allowedDepth = Math.min(previousDepth + 1, depthSix);
                if (node.depth !== allowedDepth) {
                    node.depth = allowedDepth as HeadingDepth;
                }
            }
            previousDepth = node.depth;
        });
    }
}

function isElement(node: Node): node is Element {
    return node.type === 'element';
}

/**
 * This plugin should take the elements between the "Ingredients" heading and the "Method" heading
 * and places them in a div. Also takes everything after the "Method" heading and places it into a Div. 
 * If there is another heading after the "Method" heading everything up until that heading will be
 * placed into the div
 */

export function insertSections() {
    return (tree: Root, _: VFile) => {
        /**
         * Returns a copy of the provided array of {@link ElementContent} where all members between {@link index} and the index of the first member matching 
         * the provided {@link predicate} have been added as children to a new 'div' element. If no element mathches the predicate, all elements from index 
         * to the end of the array will be added as children. Returns {@link undefined} if the 
         */
        const insertDiv = (index: number, children: ElementContent[], predicate: (node: ElementContent) => boolean): ElementContent[] => {
            const siblingsStart = index + 1;
            const youngerSiblings = children.slice(siblingsStart);
            let foundIndex = youngerSiblings.findIndex(predicate);

            /* 
             Early out. Only div the ingredients if there are siblings between the `ingredients` 
             heading and a `method` heading
             */
            // if (foundIndex <= 0) return;
            let stopIndex;
            if (foundIndex > 0) {
                stopIndex = foundIndex + siblingsStart
            }

            // Just turn the siblings between `ingredients` and `method` into grandchildren
            const grandChildren: ElementContent[] = (children as ElementContent[]).slice(siblingsStart, stopIndex);
            const newParent: Element = {
                type: 'element',
                tagName: 'div',
                children: grandChildren
            }
            // Remove the grand children from the list of siblings and insert the new parent in its place
            children.splice(siblingsStart, grandChildren.length, newParent);
            return children;
        }

        visit(tree, 'element', (node, index, parent) => {
            // Early out. We need both of these to do anything.
            if (parent === null || index === null) {
                return;
            }
            /* 
             This id is added by the rehypeSlug plugin which takes a heading title and slugifies it.
             The slug for the "Ingredients" section is "ingredients"
             */
            if (node.properties?.id === 'ingredients' && parent.children.length > index + 1) {
                parent.children = insertDiv(index, parent.children as ElementContent[], (childNode) => {
                    if (isElement(childNode)) {
                        return childNode.properties?.id === 'method'
                    } else {
                        return false
                    }
                });
            } else if (node.properties?.id === 'method' && parent.children.length > index + 1) {
                parent.children = insertDiv(index, parent.children as ElementContent[], (childNode) => {
                    if (isElement(childNode)) {
                        return childNode.tagName === node.tagName
                    } else {
                        return false
                    }
                });
                return [SKIP, index + 2]
            }
        });
    }
  }

/**
 * Plugin to wrap the `ingredients` and `method` sections of a recipe in `<div>` tags for easier
 * styling of the contents when in cooking mode. 
 * 
 * Needs to be run after the `rehypeSlug` plugin, which is currently run as a part of the gfm plugin
 */
export const RecipeSections: QuartzTransformerPlugin = () => {
    return {
        name: "RecipeSections",
        markdownPlugins(ctx) {
            return [normalizeHeadings]
        },
        htmlPlugins(_: BuildCtx) {
            return [rehypeSlug, insertSections];
        }
    }
}