export class DevicesListComponent extends HTMLElement {
    constructor() {
        super();
        this.append('aaa')
        this.onclick = async e => {
            const ports = await navigator.serial.getPorts()
            console.log(`Available serial ports:`, ports)
            const port = await navigator.serial.requestPort()
            console.log(`Selected serial port:`, port, port.getInfo())
            console.log(await port.open({baudRate: 115200 }))
            const queue = [];
            const analizer = new deviceInputAnalizer(queue);
            window.tmpdbg = analizer
            const reader = port.readable.getReader()
            while (true) {
                const result = await reader.read()
                queue.push(...result.value)
                analizer.analyze()
                while(this.firstChild){
                    this.removeChild(this.firstChild)
                }
                this.append(JSON.stringify(analizer.values, null, 2))
                this.style.whiteSpace='pre'
            }
            reader.releaseLock()
        }
    }
}

class deviceInputAnalizer {
    foundStart = false;
    values = {}

    constructor(queue) {
        this.queue = queue;
    }

    analyze() {
        outer:while (this.queue.length > 16) {
            if (this.foundStart) {
                const key = this.queue[0] << 24 | this.queue[1] << 16 | this.queue[2] << 8 | this.queue[3];
                const value = this.queue[4] << 24 | this.queue[5] << 16 | this.queue[6] << 8 | this.queue[7];
                console.log(`Found key: ${key}, value: ${value}`)
                this.values[key] = value;
                this.queue.splice(0, 8);
            } else {
                for (let i = 0; i < 8; i++) {
                    if (this.queue[i] != 0) {
                        this.queue.shift();
                        continue outer;
                    }
                }
                for (let i = 8; i < 16; i++) {
                    if (this.queue[i] != 0xff) {
                        this.queue.shift();
                        continue outer;
                    }
                }
                this.queue.splice(0, 16);
                this.foundStart = true;
            }
        }
    }
}

customElements.define('devices-list-component', DevicesListComponent);
