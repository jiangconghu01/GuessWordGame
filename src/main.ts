import '../styles/main.css';
import { App } from './ui/App.ts';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Root element #app not found');
}
const app = new App(root);
app.init();
