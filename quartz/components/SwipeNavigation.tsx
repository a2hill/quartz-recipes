import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/recipeSwipe.inline"

function SwipeNavigation({ fileData, cfg }: QuartzComponentProps) {
    return (<></>)
  }
  
SwipeNavigation.afterDOMLoaded = script;
  
export default (() => SwipeNavigation) satisfies QuartzComponentConstructor