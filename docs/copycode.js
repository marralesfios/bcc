"use strict";
for (const el of document.getElementsByClassName("code-block")) {
    const copybtn = document.createElement("button");
    const icon = document.createElement("img");
    icon.src = "copy.svg";
    copybtn.classList.add("copy-code");
    copybtn.append(icon);
    el.append(copybtn);
    el.addEventListener("click", async () => {
        icon.src = "check.svg";
        const existing = el.getAttribute("data-timeout");
        if (existing !== null) {
            clearTimeout(Number(existing));
        }
        await navigator.clipboard.writeText(el.textContent);
        el.setAttribute("data-timeout", setTimeout(() => {
            icon.src = "copy.svg";
        }, 1500).toString());
    });
}
