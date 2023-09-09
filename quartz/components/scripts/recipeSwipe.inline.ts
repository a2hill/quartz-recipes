// document.addEventListener("nav", () => {
    // do page specific logic here
    // e.g. attach event listeners
    // const ingredients = document.querySelector("#ingredients") as HTMLHeadingElement
    // const method = document.querySelector("#method") as HTMLHeadingElement
    // ingredients
    import('../../static/swiped-events.min.js');
    document.addEventListener('swiped-left', function(e) {
        document.getElementById("method")!.scrollIntoView();
    }, {
        passive: true
    });
    document.addEventListener('swiped-right', function(e) {
        document.getElementById("ingredients")!.scrollIntoView();
    }, {
        passive: true
    });
// });