import JSZip from "jszip";

export class InMemoryFilesystem {
    constructor() {
        this.directory = {files:[]};
    }

    async* list(path) {

        const handle = this.getDirectory(path);
        for (const entry of handle.files) {
            yield {name: entry.name, isDirectory: entry.kind === 'directory', path: path + '/' + entry.name};
        }
    }

    async readFile(path) {
        const fileHandle = this.getFile(path);
        return fileHandle.content;
    }

    getFile(path) {
        const directory = this.getDirectory(path.split('/').slice(0, -1).join('/'));
        return directory.files.find(entry => entry.name === path.split('/').pop() && entry.kind == 'file');
    }

    getDirectory(path) {
        const parts = path.split('/').filter(p => p.length > 0);
        let currentDir = this.directory;
        for (let i = 0; i < parts.length; i++) {
            currentDir = currentDir.files.find(entry => entry.name === parts[i] && entry.kind == 'directory');
        }
        return currentDir;
    }

    async writeFileText(path, content) {
        const directory = this.getDirectory(path.split('/').slice(0, -1).join('/'));
        let file = directory.files.find(entry => entry.name === path.split('/').pop() && entry.kind == 'file');
        if (!file) {
            file = {name: path.split('/').pop(), kind: 'file', content: content};
            directory.files.push(file);
        }
        file.content = content

    }

    async writeFile(path, sourceFile) {
        this.writeFileText(path, await sourceFile.text());
    }

    async createEmptyFile(path) {
        const directory = this.getDirectory(path.split('/').slice(0, -1).join('/'));
        let file = directory.files.find(entry => entry.name === path.split('/').pop() && entry.kind == 'file');
        if (!file) {
            file = {name: path.split('/').pop(), kind: 'file', content: ''};
            directory.files.push(file);
        }
    }

    async createDirectory(path) {
        const parentDir = this.getDirectory(path.split('/').slice(0, -1).join('/'));
        let dir = parentDir.files.find(entry => entry.name === path.split('/').pop() && entry.kind == 'directory');
        if (!dir) {
            dir = {name: path.split('/').pop(), kind: 'directory', files: []};
            parentDir.files.push(dir);
        }
    }

    async generateSingleProjectFile() {
        const zip = new JSZip();
        await this.addDirToZip(zip, this.directory, '');
        return await zip.generateAsync({type: "blob"})
    }

    async addDirToZip(zip, dirHandle, path) {
        for (const entry of dirHandle.files) {
            if (entry.kind === 'file') {
                zip.file(path + entry.name, entry.content);
            } else if (entry.kind === 'directory') {
                const newPath = path + entry.name + '/';
                await this.addDirToZip(zip, entry, newPath);
            }
        }
    }

    async loadProjectFile(file) {
        console.log('Loading project file', file);
        const zip=await  JSZip.loadAsync(file);
        console.log('zip loaded', zip);
        for (const x of Object.values(zip.files)) {
            await this.writeFileText(x.name, await x.async('text'))
        }
    }
}
