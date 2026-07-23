import {create} from "fast-creator";
import {InputNode} from "greenplc-core/src/syntaxTree/inputNode.mjs";
import {OutputNode} from "greenplc-core/src/syntaxTree/outputNode.mjs";
import {SetNode} from "greenplc-core/src/syntaxTree/setNode.mjs";
import {SymbolNode} from "greenplc-core/src/syntaxTree/symbolNode.mjs";
import {BoolLiteralNode} from "greenplc-core/src/syntaxTree/boolLiteralNode.mjs";
import {IntegerLiteralNode} from "greenplc-core/src/syntaxTree/integerLiteralNode.mjs";
import {SubmoduleCallNode} from "greenplc-core/src/syntaxTree/submoduleCallNode.mjs";
import {ContextMenuComponent} from "../contextMenuComponent.js";

export class ModuleGraphicalComponent extends HTMLElement {
    constructor(module) {
        super();
        const resizeObserver = new ResizeObserver(() => {
            this.regenerateLines();
        });
        resizeObserver.observe(this);
        const header = create('header', {text: module.name ?? '(Unnamed Module)'})
        this.append(header);
        const inputs = create('div', {class: 'inputs'})
        this.append(inputs)
        const body = create('div', {class: 'body'})
        this.body = body;
        this.append(body)
        const outputs = create('div', {class: 'outputs'})
        this.append(outputs)
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        this.svg = svg;
        this.append(svg)

        for (const [name, item] of Object.entries(module.items)) {
            if (item instanceof InputNode) {
                const element = create('div.block.input', create({text: name}), create({text: item.type}));
                element.node = item;
                inputs.append(element);
                if (item.devicePort) {
                    const select = create('select', ...item.devicePort.modes.map(mode => create('option', {
                        text: mode.direction + ' ' + mode.type,
                        selected: mode.direction === 'input' && mode.type === item.type
                    })));
                    element.append(select)
                }
                element.draggable = true;
                element.addEventListener('dragstart', e => {
                    e.dataTransfer.setData('text/plain', name);
                    e.dataTransfer.setData('text/x-greenplc-outputed', name);
                });
            } else if (item instanceof OutputNode) {
                const element = create('div.block.output', create({text: name}), create({text: item.type}));
                element.node = item;
                outputs.append(element);
                element.addEventListener('dragover', e => {
                    if (e.dataTransfer.types.includes('text/x-greenplc-outputed')) {
                        e.preventDefault();
                    }
                })
                element.addEventListener('drop', e => {
                    if (e.dataTransfer.types.includes('text/x-greenplc-outputed')) {
                        e.preventDefault();
                        const inputName = e.dataTransfer.getData('text/x-greenplc-outputed');
                        console.log('aaaa')
                        module.loop.push(new SetNode(new SymbolNode(name), new SymbolNode(inputName)));
                        this.saveChanges()
                    }
                })
            } else {
                body.append(name, item);
            }
        }
        for (let statement of module.loop) {
            this.addNode(statement, 1)
        }
        this.addEventListener('dragover', e => {
            if (e.dataTransfer.types.includes('text/x-greenplc-module')) {
                e.preventDefault();
            }
        });
        this.addEventListener('drop', e => {
            if (e.dataTransfer.types.includes('text/x-greenplc-module')) {
                e.preventDefault();
                const moduleName = e.dataTransfer.getData('text/x-greenplc-module');
                const symbolNode = new SymbolNode(moduleName);
                symbolNode.name = moduleName;
                module.loop.push(new SubmoduleCallNode(symbolNode));
                this.saveChanges()
            }
        })
        this.oncontextmenu = e => {
            e.preventDefault()
            e.stopPropagation();
            const items = [];
            if (!module.isDeviceModule) {
                items.push({
                    label: 'Add input',
                    action: () => {
                        console.log('Adding input')
                        const name = prompt('Enter input name:');
                        if (name) {
                            const inputNode = new InputNode();
                            inputNode.type = 'bool';
                            module.items[name] = inputNode;
                            this.saveChanges()
                        }
                    }
                });

                items.push({
                    label: 'Add output',
                    action: () => {
                        console.log('Adding output')
                        const name = prompt('Enter output name:');
                        if (name) {
                            const outputNode = new OutputNode();
                            outputNode.type = 'bool';
                            module.items[name] = outputNode;
                            this.saveChanges()
                        }
                    }
                });
            }
            ContextMenuComponent.create(e, items)
        };
    }

    addNode(statement, level) {
        console.log('Adding node', statement, 'at level', level)
        while (this.body.children.length < level + 1) {
            this.body.insertBefore(create('.level'), this.body.firstChild)
        }
        const levelElement = this.body.children[this.body.children.length - level - 1];
        if (statement instanceof SymbolNode) {
            return [...this.querySelectorAll('*')].find(x => x.node == statement.referencedNode);
        } else if (statement instanceof SetNode) {
            let targetElement;
            let sourceElement;
            if (statement.target instanceof SymbolNode) {
                targetElement = [...this.querySelectorAll('*')].find(x => x.node == statement.target.referencedNode);
            }
            sourceElement = this.addNode(statement.value, level + 1);
            const line = document.createElementNS(this.svg.namespaceURI, "line");
            line.source = sourceElement;
            line.target = targetElement;
            this.svg.append(line)
        } else if (statement instanceof BoolLiteralNode) {
            const element = create('div.block.literal', {text: statement.value.toString()});
            element.append(create('input', {
                type: 'checkbox', checked: statement.value, onchange: e => {
                    statement.value = e.target.checked
                    this.saveChanges()
                }
            }));
            levelElement.append(element);
            return element
        } else if (statement instanceof IntegerLiteralNode) {
            const element = create('div.block.literal', {text: statement.value.toString()});
            element.append(create('input', {
                type: 'number', value: statement.value, onchange: e => {
                    statement.value = parseInt(e.target.value)
                    this.saveChanges()
                }
            }));
            levelElement.append(element);
            return element
        } else if (statement instanceof SubmoduleCallNode) {
            const element = create('div.block.submodule', create('.title', {text: statement.source.name.toString()}), create('.submoduleInputs'), create('.submoduleOutputs'));
            levelElement.append(element);
            const itemElements = {};
            if (statement.source.referencedNode) {
                for (const [name, item] of Object.entries(statement.source.referencedNode.items)) {
                    if (item instanceof InputNode) {
                        const inputElement = create('div.blockInput', create({text: name}), create({text: item.type}));
                        element.querySelector('.submoduleInputs').append(inputElement);
                        itemElements[name] = inputElement;
                    } else if (item instanceof OutputNode) {
                        const outputElement = create('div.blockOutput', create({text: name}), create({text: item.type}));
                        element.querySelector('.submoduleOutputs').append(outputElement);
                        itemElements[name] = outputElement;
                    }
                }
            }
            for (const paramName in statement.parametersValues.named) {
                const param = statement.parametersValues.named[paramName];
                const paramElement = this.addNode(param, level + 1);
                const line = document.createElementNS(this.svg.namespaceURI, "line");
                line.source = paramElement;
                line.target = itemElements[paramName]||element;
                this.svg.append(line)
            }
            for (const param of statement.parametersValues.positioned) {
                const paramElement = this.addNode(param, level + 1);
                const line = document.createElementNS(this.svg.namespaceURI, "line");
                line.source = paramElement;
                line.target = element;
                this.svg.append(line)
            }
            return element
        } else {
            levelElement.append(statement);
        }
    }

    regenerateLines() {
        for (const line of this.querySelectorAll('svg line')) {
            const sourceElement = line.source;
            const targetElement = line.target;
            if (targetElement) {
                line.setAttribute('x1', targetElement.offsetLeft);
                line.setAttribute('y1', targetElement.offsetTop + targetElement.offsetHeight / 2);
            }
            if (sourceElement) {
                line.setAttribute('x2', sourceElement.offsetLeft + sourceElement.offsetWidth);
                line.setAttribute('y2', sourceElement.offsetTop + sourceElement.offsetHeight / 2);
            }
        }
    }

    saveChanges() {
        const event = new CustomEvent('saverequest', {bubbles: true});
        this.dispatchEvent(event)
    }
}

customElements.define('module-graphical-component', ModuleGraphicalComponent);
