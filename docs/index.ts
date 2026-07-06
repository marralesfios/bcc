function hover_frames(elem: HTMLElement,fn: (ft: number) => void){
    elem.addEventListener("mouseenter",() => {
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
