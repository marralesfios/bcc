"use strict";
function hover_frames(elem, fn) {
    elem.addEventListener("pointerenter", () => {
        let start;
        function repeat(t) {
            if (start === undefined) {
                start = t;
                fn(0);
            }
            else {
                fn(t - start);
                start = t;
            }
            if (elem.matches(":hover")) {
                window.requestAnimationFrame(repeat);
            }
        }
        window.requestAnimationFrame(repeat);
    });
}
const gallery_viewport = document.getElementById("imgal");
const gallery = document.getElementById("galimgs");
const hand_left = document.getElementById("hand-left");
const hand_right = document.getElementById("hand-right");
hover_frames(hand_left, (dur) => {
    gallery.scrollBy({
        left: -3 * dur,
        behavior: "instant"
    });
});
hover_frames(hand_right, (dur) => {
    gallery.scrollBy({
        left: 3 * dur,
        behavior: "instant"
    });
});
function update_scrollhands() {
    if (gallery.scrollLeft)
        hand_left.classList.add("scroll-valid");
    else
        hand_left.classList.remove("scroll-valid");
    if (gallery.scrollLeft < gallery.scrollWidth - gallery.clientWidth)
        hand_right.classList.add("scroll-valid");
    else
        hand_right.classList.remove("scroll-valid");
}
gallery.addEventListener("scroll", update_scrollhands);
new ResizeObserver(update_scrollhands).observe(gallery_viewport);
update_scrollhands();
