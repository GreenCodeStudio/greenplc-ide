import {FileTreeComponent} from "./fileTreeComponent.js";
import {SubwindowComponent} from "./subwindowComponent.js";
import {DevicesListComponent} from "./devicesListComponent.js";
import {create} from "fast-creator";
import {ContextMenuComponent} from "./contextMenuComponent.js";
import {LocalFilesystem} from "./filesystem/localFilesystem.js";

export class LayoutComponent extends HTMLElement {
    constructor() {
        super();
        this.generateMenu()
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

    generateMenu() {
        this.menu = create('nav', {class: 'menu'})
        this.append(this.menu)
        this.menu.append(create('button', {
            text: 'File', onclick: e => {
                const items = [];
                items.push({
                    label: 'Open project directory', action: async () => {
                        const directory = await window.showDirectoryPicker();
                        console.log(`Selected directory: ${directory.name}`, directory);
                        let treeComponent = this.querySelector('file-tree-component');
                        if (!treeComponent) {
                            treeComponent = new FileTreeComponent();
                            this.add(treeComponent)
                        }
                        treeComponent.load(new LocalFilesystem(directory))
                    }
                })

                let treeComponent = this.querySelector('file-tree-component');
                if (treeComponent.filesystem) {
                    items.push({
                        label: 'Save as single project file', action: async () => {
                            const promise = treeComponent.filesystem.generateSingleProjectFile()
                            const handle = await window.showSaveFilePicker({suggestedName: 'project.gplcproject',
                                types: [
                                    {
                                        description: "Green PLC Project File",
                                        accept: { "application/greenplc-project": [".gplcproject"] },
                                    },
                                ],});
                            const writable = await handle.createWritable();
                            await writable.write(await promise);
                            await writable.close();
                        }
                    })
                }
                ContextMenuComponent.create(e, items)
            }
        }));
    }
}

customElements.define('layout-component', LayoutComponent);
