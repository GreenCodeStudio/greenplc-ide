import {InMemoryFilesystem} from "./InMemoryFilesystem.js";

export class ProjectFileFilesystem extends InMemoryFilesystem {
    constructor(file) {
        super();
        this.loaded = false;
        file.getFile().then(x=>this.loadProjectFile(x)).then(() => this.loaded = true)
        this.projectFile = file;
    }

    async writeFileText(path, content) {
        await super.writeFileText(path, content)
        await this.saveProjectFile()
    }

    async createEmptyFile(path) {
        await super.createEmptyFile(path)
        await this.saveProjectFile()
    }

    async createDirectory(path) {
        await super.createDirectory(path)
        await this.saveProjectFile()
    }

    async saveProjectFile() {
        if (this.loaded) {
            const data = this.generateSingleProjectFile();
            const writable = await this.projectFile.createWritable();
            await writable.write(await data);
            await writable.close();
        }
    }

}
