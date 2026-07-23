import {create} from "fast-creator";

export class SubwindowComponent extends HTMLElement {
    constructor(element) {
        super();
        const header = document.createElement('header');
        header.textContent = element.title || element.tagName;
        header.append(create('button', {text: 'X', onclick: () => this.remove()}))
        this.append(header)
        this.append(element)
    }
}

customElements.define('subwindow-component', SubwindowComponent);
