import {LocalFilesystem} from "./filesystem/localFilesystem.js";
import {FileEditorComponent} from "./editor/fileEditorComponent.js";
import {ContextMenuComponent} from "./contextMenuComponent.js";
import {create} from "fast-creator";

export class FileTreeComponent extends HTMLElement {
    constructor() {
        super();
        this.classList.add('notLoaded')
        const loadButton = document.createElement('button');
        loadButton.textContent = 'Load directory';
        loadButton.onclick = async () => {
            const directory = await window.showDirectoryPicker();
            console.log(`Selected directory: ${directory.name}`, directory);
            this.load(new LocalFilesystem(directory))
        }
        this.append(loadButton)
        this.addEventListener('dragover',e=>{
            if (e.dataTransfer.types.includes('Files')) {
                e.preventDefault();
            }
        })
        this.addEventListener('drop', async e => {
            e.preventDefault()
            for (const item of e.dataTransfer.items) {
                const handle = await item.getAsFileSystemHandle();
                if (handle.kind === 'directory') {
                    this.load(new LocalFilesystem(handle))
                } else {
                    if(this.filesystem){
                        const file=await handle.getFile();
                        this.filesystem.writeFile(handle.name, file)
                    }
                }
            }
        });
    }

    async load(filesystem) {
        this.filesystem = filesystem
        this.classList.remove('notLoaded')
        this.subLoad(this, filesystem, '/')
    }

    async subLoad(element, filesystem, path) {
        while (element.firstChild) {
            element.removeChild(element.firstChild)
        }
        for await (let x of filesystem.list(path)) {
            const item = create('div', {class: 'item '+(x.isDirectory ? 'directory' : (x.name.toString().toLocaleLowerCase().endsWith('.gplc') ? 'gplcFile' : 'file'))});
            item.textContent = x.name;
            const itemWrapper = create('div', {class: 'itemWrapper'}, item);
            element.append(itemWrapper)
            item.onclick = () => {
                if (x.isDirectory) {

                } else {
                    const layout = document.querySelector('layout-component');
                    layout.add(new FileEditorComponent(filesystem, x.path), true)
                }
            }
            if (x.isDirectory) {
                const subTree = create('.subTree');
                itemWrapper.append(subTree);
                this.subLoad(subTree, filesystem, x.path)
            }
            item.draggable=true;
            item.ondragstart = e => {
                e.dataTransfer.setData('text/x-greenplc-filePath', x.path);
            }
        }
        this.oncontextmenu = e => {
            e.preventDefault()
            const items = [
                {
                    label: 'Refresh',
                    action: () => this.load(filesystem)
                },
                {
                    label: 'New File',
                    action: async () => {
                        const input = create('input')
                        this.append(create('div', input))
                        input.onblur = async () => {
                            await filesystem.createEmptyFile(input.value, '')
                            input.parentNode.replaceChild(document.createTextNode(input.value), input)
                        };
                        input.focus()
                    }
                },
                {
                    label: 'New Directory',
                    action: async () => {
                        const input = create('input')
                        this.append(create('div', input))
                        input.onblur = async () => {
                            await filesystem.createDirectory(input.value, '')
                            input.parentNode.replaceChild(document.createTextNode(input.value), input)
                        };
                        input.focus()
                    }
                }
            ]
            ContextMenuComponent.create(e, items)
        }
    }
}

customElements.define('file-tree-component', FileTreeComponent);
