import JSZip from "jszip";

export class LocalFilesystem {
    constructor(directory) {
        this.directory = directory;
    }

    async* list(path) {

        const handle = await this.getDirectoryHandle(path);
        for await (const entry of handle.values()) {
            yield {name: entry.name, isDirectory: entry.kind === 'directory', path: path + '/' + entry.name};
        }
    }

    async readFile(path) {
        const fileHandle = await this.getFilehandle(path);
        const file = await fileHandle.getFile();
        return await file.text();
    }

    async getFilehandle(path) {
        const parts = path.split('/').filter(p => p.length > 0);
        let currentDir = this.directory;
        for (let i = 0; i < parts.length - 1; i++) {
            currentDir = await currentDir.getDirectoryHandle(parts[i]);
        }
        return await currentDir.getFileHandle(parts[parts.length - 1]);
    }

    async getDirectoryHandle(path) {
        const parts = path.split('/').filter(p => p.length > 0);
        let currentDir = this.directory;
        for (let i = 0; i < parts.length; i++) {
            currentDir = await currentDir.getDirectoryHandle(parts[i]);
        }
        return currentDir;
    }

    async writeFileText(path, content) {

        const file = await this.getFilehandle(path);
        const writable = await file.createWritable();
        await writable.write(content);
        await writable.close();
    }

    async writeFile(path, sourceFile) {

        const file = await this.getFilehandle(path);
        const writable = await file.createWritable();
        await writable.write(sourceFile);
        await writable.close();
    }

    async createEmptyFile(path) {
        const dirPath = path.split('/').slice(0, -1).join('/');
        const dir = await this.getDirectoryHandle(dirPath);
        dir.getFileHandle(path.split('/').pop(), {create: true});
    }

    async createDirectory(path) {
        const dirPath = path.split('/').slice(0, -1).join('/');
        const dir = await this.getDirectoryHandle(dirPath);
        dir.getDirectoryHandle(path.split('/').pop(), {create: true});
    }

    async generateSingleProjectFile() {
        const zip = new JSZip();
        await this.addDirToZip(zip, this.directory, '');
        return await zip.generateAsync({type: "blob"})
    }

    async addDirToZip(zip, dirHandle, path) {
        const promises = [];
        for await (const entry of dirHandle.values()) {
            const entryPath = path ? (path + '/' + entry.name) : entry.name;
            if (entry.kind === 'directory') {
                promises.push(dirHandle.getDirectoryHandle(entry.name).then(async subDirHandle => {
                    await this.addDirToZip(zip, subDirHandle, entryPath);
                }));
            } else if (entry.kind === 'file') {
                promises.push(dirHandle.getFileHandle(entry.name).then(async fileHandle => {
                    const file = await fileHandle.getFile();
                    zip.file(entryPath, file);
                }));
            }
        }
        await Promise.all(promises);
    }
}
