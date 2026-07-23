import {create} from "fast-creator";
import {SerializedFragment} from "greenplc-core/src/parser/serializedFragment.mjs";

export class SerializedCodeVisualizationComponent extends HTMLElement {
    constructor() {
        super();
    }

    add(serializedFragment) {
        this.append(this.toHtmlElement(serializedFragment))
    }

    toHtmlElement(serializedFragment) {
        let ret = create('span')
        ret.node = serializedFragment.node
        ret.referencedNode = serializedFragment.node?.referencedNode
        ret.title = serializedFragment.node
        ret.onmousemove = e => {
            if (serializedFragment.node) {
                e.stopPropagation();
                for (const x of this.querySelectorAll('*')) {
                    x.classList.toggle('hover', x.node === serializedFragment.node)
                    x.classList.toggle('hover-referenced', x.referencedNode === serializedFragment.node)
                    x.classList.toggle('hover-referenced-reverse', x.node === serializedFragment.node?.referencedNode)
                }
            }
        }
        for (const part of serializedFragment.parts) {
            if (part instanceof SerializedFragment) {
                ret.append(this.toHtmlElement(part))
            } else {
                ret.append(part)
            }
        }
        return ret;
    }
}

customElements.define('serialized-code-visualization-component', SerializedCodeVisualizationComponent);
