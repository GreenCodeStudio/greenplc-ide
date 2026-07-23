export class AbstractFilesystem{
    constructor() {

        this.onChangeListeners = [];
        this.changedPending = false;
    }
    addOnchangeListener(callback) {
        this.onChangeListeners.push(callback)
    }

    markChanged() {
        if (!this.changedPending) {
            this.changedPending = true;
            setImmediate(() => {
                this.changedPending = false;
                for (const onChangeListener of this.onChangeListeners) {
                    try {
                        onChangeListener();
                    } catch (e) {
                        console.error('Error in onChangeListener', e);
                    }
                }
            });
        }
    }
}
