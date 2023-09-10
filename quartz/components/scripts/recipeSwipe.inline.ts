
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