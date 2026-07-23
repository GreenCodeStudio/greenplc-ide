import {create} from "fast-creator";
import {ModuleNode} from "greenplc-core/src/syntaxTree/moduleNode.mjs";

export class ToolboxComponent extends HTMLElement {
    constructor() {
        super();
    }

    render(environment) {
        for (const name in environment.getAll()) {
            const x = environment.getElement(name);
            const element = create('div', {class: 'toolboxItem'});
            element.append(create('.name', {text: name}))
            if (x instanceof ModuleNode) {
                element.append(create('.type', {text: 'Module'}))
                element.draggable = true;
                element.addEventListener('dragstart', e => {
                    e.dataTransfer.setData('text/plain', name);
                    e.dataTransfer.setData('text/x-greenplc-module', name);
                });
                this.append(element)
            }
        }
    }
}

customElements.define('toolbox-component', ToolboxComponent);
