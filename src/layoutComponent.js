import {FileTreeComponent} from "./fileTreeComponent.js";
import {SubwindowComponent} from "./subwindowComponent.js";
import {DevicesListComponent} from "./devicesListComponent.js";
import {create} from "fast-creator";

export class LayoutComponent extends HTMLElement {
    constructor() {
        super();
        this.aside = create('aside')
        this.append(this.aside)
        this.main = create('main')
        this.append(this.main)
        this.add(new FileTreeComponent())
        this.add(new DevicesListComponent())
    }

    add(element, asContent = false) {
        const subwindow = new SubwindowComponent(element);
        if (asContent) {
            this.main.append(subwindow)
        } else {
            this.aside.append(subwindow)
        }
    }
}

customElements.define('layout-component', LayoutComponent);
