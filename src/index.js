import {LayoutComponent} from "./layoutComponent.js";
import './style/indes.scss'

console.log('Hello, world!')
document.body.append(new LayoutComponent())

// Register service worker
if ('serviceWorker' in navigator) {

    navigator.serviceWorker.register('/sw.js').then(() => {
      console.log('Service worker registered.');
    }).catch((err) => {
      console.warn('Service worker registration failed:', err);
    });

}
