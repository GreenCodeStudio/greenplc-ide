import {ToOutputConverter} from "greenplc-core/src/converter/toOutputConverter.mjs";
import Parser from "greenplc-core/src/parser/parser.mjs";
import {Serializer} from "greenplc-core/src/parser/serializer.mjs";
import {ArduinoCodeBuilder} from "greenplc-core/src/builder/arduinoCodeBuilder.mjs/arduinoCodeBuilder.mjs";
import {create} from "fast-creator";
import {SerializedCodeVisualizationComponent} from "./serializedCodeVisualizationComponent.js";
import {SemanticFiller} from "greenplc-core/src/semanticFiller.mjs";
import {ModuleGraphicalComponent} from "./moduleGraphicalComponent.js";
import {ContextMenuComponent} from "../contextMenuComponent.js";
import {ModuleNode} from "greenplc-core/src/syntaxTree/moduleNode.mjs";
import {ToolboxComponent} from "./toolboxComponent.js";
import {Environment} from "greenplc-core/src/environment.mjs";

export class FileEditorComponent extends HTMLElement {
    constructor(filesystem, path) {
        super();
        console.log(`Loading file ${path} from filesystem`, filesystem)
        this.load(filesystem, path)
        this.title = path;
    }

    async load(filesystem, path) {
        const content = await filesystem.readFile(path);
        this.filesystem = filesystem;
        this.path = path;

        if (path.toLocaleLowerCase().endsWith('.gplc')) {
            const codeEditor = create('div.codeEditor', {contenteditable: 'true'});
            codeEditor.textContent = content
            this.append(codeEditor)
            const info = create('div.info');
            this.info = info;
            this.append(info)
            codeEditor.addEventListener('input', () => {
                this.regenerateInfo(info, codeEditor.textContent);
                filesystem.writeFile(path, codeEditor.textContent);
            });
            codeEditor.addEventListener('change', () => {
                if (codeEditor.children.length > 0) {
                    codeEditor.textContent = codeEditor.textContent
                }
            });
            this.regenerateInfo(info, content);
            this.oncontextmenu = e => {
                e.preventDefault()
                const items = [
                    {
                        label: 'Add module',
                        action: () => {
                            const parser = new Parser(codeEditor.textContent);
                            parser.parse();
                            parser.modules.push(new ModuleNode());
                            const serializedCode = parser.modules.map(m => Serializer.serialize(m)).join('\n');
                            codeEditor.textContent = serializedCode;
                            filesystem.writeFile(path, serializedCode);

                            this.regenerateInfo(this.info, serializedCode)
                        }
                    },
                    {
                        label:'Reformat code',
                        action: () => {
                            const parser = new Parser(codeEditor.textContent);
                            parser.parse();
                            const serializedCode = parser.modules.map(m => Serializer.serialize(m)).join('\n');
                            codeEditor.textContent = serializedCode;
                            filesystem.writeFile(path, serializedCode);
                        }
                    }
                ]
                ContextMenuComponent.create(e, items)
            }
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = content;
            this.append(textarea)
            textarea.onchange = async () => {
                await filesystem.writeFile(path, textarea.value);
            }
        }
    }

    regenerateInfo(info, code) {
        while (info.firstChild) {
            info.removeChild(info.firstChild)
        }
        try {
            const parser = new Parser(code);
            parser.parse();
            const codeSerialized = new SerializedCodeVisualizationComponent();
            info.append('Code parsed and serialized:');
            info.append(codeSerialized)

            const codeSemanticalyFilledSerialized = new SerializedCodeVisualizationComponent();
            info.append('Code semantically filled :');
            info.append(codeSemanticalyFilledSerialized)
            const codeToOutput = new SerializedCodeVisualizationComponent();
            info.append('Code converted to output:');
            info.append(codeToOutput)
            info.append('Graphical:');
            const graphical = create('div.graphical');
            info.append(graphical)
            info.append('Toolbox:');
            const toolbox = new ToolboxComponent()
            info.append(toolbox)
            toolbox.render(Environment.globalEnvironment)

            info.append('Arduino C code:');
            for (const module of parser.modules) {
                try {
                    codeSerialized.add(Serializer.serialize(module))
                } catch (e) {
                    console.info(e)
                }
                try {
                    codeToOutput.add(Serializer.serialize(ToOutputConverter.convertModule(module)))
                } catch (e) {
                    console.info(e)
                }
                try {
                    if (module.isDeviceModule && module.deviceName === 'ArduinoNano') {
                        info.append(create('code', {text: ArduinoCodeBuilder.build(module)}))
                    }
                } catch (e) {
                    console.info(e)
                }
            }
            try {
                const clonedModules = parser.modules.map(m => m.clone());
                const env = SemanticFiller.prepareBasicEnvironment(clonedModules)
                for (const x of clonedModules) {
                    SemanticFiller.fill(x, env)
                    codeSemanticalyFilledSerialized.add(Serializer.serialize(x));
                    graphical.append(new ModuleGraphicalComponent(x))
                }

                this.addEventListener('saverequest', e => {
                    const serializedCode = clonedModules.map(m => Serializer.serialize(m)).join('\n');
                    console.log('saving code', serializedCode)
                    this.querySelector('div.codeEditor').textContent = serializedCode;
                    this.filesystem.writeFile(this.path, serializedCode);
                    this.regenerateInfo(this.info, serializedCode)

                })
            } catch (e) {
                console.info(e)
            }

        } catch (e) {

            console.warn(e)
        }
    }
}

customElements.define('file-editor-component', FileEditorComponent);
