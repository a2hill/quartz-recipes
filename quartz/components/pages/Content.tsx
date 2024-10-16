import { htmlToJsx } from "../../util/jsx"
import { QuartzComponentConstructor, QuartzComponentProps } from "../types"

function Content({ fileData, tree }: QuartzComponentProps) {
  const content = htmlToJsx(fileData.filePath!, tree)
  return (
    <>
      {/* TODO: Work on cooking mode button */}
      {/* <a href="#ingredients">Start Cooking</a> */}
      <article class="popover-hint">{content}</article>
    </>
  )
}

export default (() => Content) satisfies QuartzComponentConstructor
