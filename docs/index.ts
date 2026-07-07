function hover_frames(elem: HTMLElement,fn: (ft: number) => void){
    elem.addEventListener("pointerenter",() => {
        let start: number;
        function repeat(t: number){
            if(start === undefined){
                start = t;
                fn(0);
            }else{
                fn(t-start);
                start = t;
            }
            if(elem.matches(":hover")){
                window.requestAnimationFrame(repeat);
            }
        }
        window.requestAnimationFrame(repeat);
    });
}
const gallery_viewport = document.getElementById("imgal") as HTMLDivElement;
const gallery = document.getElementById("galimgs") as HTMLDivElement;
const hand_left = document.getElementById("hand-left") as HTMLDivElement;
const hand_right = document.getElementById("hand-right") as HTMLDivElement;
hover_frames(hand_left,(dur) => {
    gallery.scrollBy({
        left: -3*dur,
        behavior: "instant"
    });
});
hover_frames(hand_right,(dur) => {
    gallery.scrollBy({
        left: 3*dur,
        behavior: "instant"
    });
});
function update_scrollhands(){
    if(gallery.scrollLeft) hand_left.classList.add("scroll-valid");
    else hand_left.classList.remove("scroll-valid");
    console.log(gallery.scrollLeft,gallery.scrollWidth-gallery.clientWidth);
    if(gallery.scrollLeft < gallery.scrollWidth-gallery.clientWidth-1) hand_right.classList.add("scroll-valid");
    else hand_right.classList.remove("scroll-valid");
    
}
gallery.addEventListener("scroll",update_scrollhands);
new ResizeObserver(update_scrollhands).observe(gallery_viewport);
update_scrollhands();
