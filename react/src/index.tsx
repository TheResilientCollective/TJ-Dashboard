import {createRoot} from 'react-dom/client';
import './index.css';
import {App as Map} from './App';
import {Panel} from './Sidepanel';

const root = createRoot(document.getElementById('root')!);
root.render(<div><Map/><Panel/></div>);
document.getElementById('root')!.classList.add('light');
