import { JSXElement } from "estree-jsx";
import { transformInternalLink, transformLink } from "../util/path";
import { QuartzComponentConstructor, QuartzComponentProps } from "./types"


const hiddenProperties = ['title', 'alias', 'draft', 'date', 'up', 'tags'];

function getAnchorTags(fileNames: string[]) {
    return fileNames.map(it => {
        return (<a href={transformInternalLink(it)} class="internal">{it}</a>)
    })
}

function FrontMatter({ fileData, displayClass }: QuartzComponentProps) {
  if (fileData.frontmatter) {
    const properties = Object.keys(fileData.frontmatter)
        .filter((prop) => {
            const shouldHide = hiddenProperties.includes(prop);
            const value = fileData.frontmatter![prop];
            let invalid = false;
            if (value === null) {
                invalid = true;
            } else if (typeof value == "string") {
                invalid = value.trim() === ""
            } else if (Array.isArray(value)) {
                invalid = value.length == 0;
            }
            return !invalid && !shouldHide;
        });
    if (properties.length > 0) {
        const headers = properties.map(prop => prop.replace(/\b\w/g, match => match.toUpperCase()))
        const values = properties.map(prop => fileData.frontmatter![prop]);
        return (
        <div class="table-container">
            <table>
                {properties.map((prop) => {
                    const header = prop.replace(/\b\w/g, match => match.toUpperCase());
                    const value = fileData.frontmatter![prop];
                    let formattedValue = Array.isArray(value) ? value.join(', ') : value;

                    // The related property contains links to other files
                    if (prop === 'related' && Array.isArray(value)) {
                        // The tags class provides nice formatting for groups of links
                        formattedValue = (<div class='tags'> {getAnchorTags(value)} </div>)
                    } else if (prop === 'source') {
                        try {
                            const link = new URL(value);
                            formattedValue = (<a href={link.toString()}>{value}</a>)
                        } catch {}
                    }
                    return (<tr>
                        <th>{header}</th>
                        <td>{formattedValue}</td>
                    </tr>)
                })}
            </table>
        </div>
        )
      
    } else {
        return null;
    }
  } else {
    return null;
  }
}

export default (() => FrontMatter) satisfies QuartzComponentConstructor
