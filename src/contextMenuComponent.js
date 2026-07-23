export class ContextMenuComponent extends HTMLElement {
    constructor() {
        super();
    }

    static create(event, items) {
        const menu = new ContextMenuComponent();
        menu.tabIndex = 0;
        menu.style.setProperty('--x', `${event.clientX}px`);
        menu.style.setProperty('--y', `${event.clientY}px`);
        for (const item of items) {
            const menuItem = document.createElement('div');
            menuItem.textContent = item.label;
            menuItem.onmousedown = () => {
                item.action();
            }
            menu.append(menuItem);
        }
        document.body.append(menu);
        menu.addEventListener('blur', () => {
            menu.parentNode?.removeChild(menu);
        });
        menu.focus()
    }
}

customElements.define('context-menu-component', ContextMenuComponent);
