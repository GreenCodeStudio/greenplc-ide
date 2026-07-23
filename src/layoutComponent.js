import {FileTreeComponent} from "./fileTreeComponent.js";
import {SubwindowComponent} from "./subwindowComponent.js";
import {DevicesListComponent} from "./devicesListComponent.js";
import {create} from "fast-creator";
import {ContextMenuComponent} from "./contextMenuComponent.js";
import {LocalFilesystem} from "./filesystem/localFilesystem.js";
import {InMemoryFilesystem} from "./filesystem/InMemoryFilesystem.js";
import {ProjectFileFilesystem} from "./filesystem/ProjectFileFilesystem.js";

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

        this.addEventListener('dragover', e => {
            if (e.dataTransfer.types.includes('Files')) {
                e.preventDefault();
            }
        })
        this.addEventListener('drop', async e => {
            e.preventDefault()
            for (const item of e.dataTransfer.items) {
                const handle = await item.getAsFileSystemHandle();
                if (handle.kind === 'directory') {
                    let treeComponent = this.querySelector('file-tree-component');
                    if (!treeComponent) {
                        treeComponent = new FileTreeComponent();
                        this.add(treeComponent)
                    }
                    treeComponent.load(new LocalFilesystem(handle))
                } else if (handle.kind === 'file' && handle.name.toLowerCase().endsWith('.gplcproject')) {
                    let treeComponent = this.querySelector('file-tree-component');
                    if (!treeComponent) {
                        treeComponent = new FileTreeComponent();
                        this.add(treeComponent)
                    }
                    const fs = new ProjectFileFilesystem(handle);
                    treeComponent.load(fs)

                }
            }
        });

        if ("launchQueue" in window) {
            launchQueue.setConsumer(async (launchParams) => {
                console.log('Launch params:', launchParams);
                for (const file of launchParams.files) {
                if (file.kind === 'file' && file.name.toLowerCase().endsWith('.gplcproject')) {
                        let treeComponent = this.querySelector('file-tree-component');
                        if (!treeComponent) {
                            treeComponent = new FileTreeComponent();
                            this.add(treeComponent)
                        }
                        const fs = new ProjectFileFilesystem(file);
                        treeComponent.load(fs)

                    }
                }
            });
        }
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
                items.push({
                    label: 'Open single project file', action: async () => {
                        const [fileHandle] = await window.showOpenFilePicker({
                            types: [
                                {
                                    description: "Green PLC Project File",
                                    accept: {"application/greenplc-project": [".gplcproject"]},
                                },
                            ],
                        });
                        let treeComponent = this.querySelector('file-tree-component');
                        if (!treeComponent) {
                            treeComponent = new FileTreeComponent();
                            this.add(treeComponent)
                        }
                        const fs = new ProjectFileFilesystem(fileHandle);
                        treeComponent.load(fs)
                    }
                })
                let treeComponent = this.querySelector('file-tree-component');
                if (treeComponent.filesystem) {
                    items.push({
                        label: 'Save as single project file', action: async () => {
                            const promise = treeComponent.filesystem.generateSingleProjectFile()
                            const handle = await window.showSaveFilePicker({
                                suggestedName: 'project.gplcproject',
                                types: [
                                    {
                                        description: "Green PLC Project File",
                                        accept: {"application/greenplc-project": [".gplcproject"]},
                                    },
                                ],
                            });
                            const writable = await handle.createWritable();
                            await writable.write(await promise);
                            await writable.close();
                        }
                    })
                }
                ContextMenuComponent.create(e, items)
            }
        }));
        this.menu.append(create('button', {
            text: 'Help', onclick: e => {
                const items = [];
                items.push({
                    label: 'About', action: async () => {
                        alert("Green PLC IDE")
                    }
                })

                ContextMenuComponent.create(e, items)
            }
        }));
    }
}

customElements.define('layout-component', LayoutComponent);
