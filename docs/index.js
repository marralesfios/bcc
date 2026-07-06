"use strict";
function hover_frames(elem, fn) {
    elem.addEventListener("mouseenter", () => {
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
