import {createRoot} from 'react-dom/client';
import './index.css';
import {App as Map} from './App';
import {Panel} from './Sidepanel';
import { MapLayers } from './Layers';
import { GlobalStateProvider } from './GlobalState';

const root = createRoot(document.getElementById('root')!);
root.render(
<GlobalStateProvider>
    <div>
        <Map />
        <div id="windows">
            <Panel />
            <MapLayers />
        </div>
    </div>
</GlobalStateProvider>
);
document.getElementById('root')!.classList.add('light');
