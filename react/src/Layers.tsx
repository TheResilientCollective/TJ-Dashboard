import { useEffect, useState } from "react";
import { FaWind, FaDroplet, FaCircleExclamation } from 'react-icons/fa6';
import { useGlobalState } from './GlobalState';
import "./Layers.css"

interface LayerToggleProps {
    id: string;
    text: string;
    icon: any;
    isEnabled: boolean;
    onToggle: () => void;
}

export const MapLayers = () => {
    const { state, setState } = useGlobalState();
    const [layers, setLayers] = useState<LayerToggleProps[]>([
        {id: "asdf", text: "Air Quality", icon: FaWind, isEnabled: false, onToggle: () => {}},
        {id: "fdsa", text: "Water Quality", icon: FaDroplet, isEnabled: true, onToggle: () => {}},
        {id: "qwer", text: "Complaints", icon: FaCircleExclamation, isEnabled: true, onToggle: () => {}},
    ]);

    const handleToggle = (id: string) => {
        setLayers(prevLayers => {
            const newLayers = [...prevLayers];
            const index = newLayers.findIndex(l => l.id === id);
            newLayers[index].isEnabled = !newLayers[index].isEnabled;
            return newLayers;
        });

        // Update global state
        setState((prevState: any) => {
            const newState = {...prevState};
            try {
                const index = newState.map.config.visState.layers.findIndex((layer: any) => layer.id === id);
                newState.map.config.visState.layers[index].config.isVisible = !newState.map.config.visState.layers[index].config.isVisible;
                return newState;
            }
            catch (e) {
                console.error("[Layers](MapLayers.handleToggle.setState) Error updating global state", e);
                return prevState;
            }
        });
    }

    // Keep the toggles in sync with the map layers
    useEffect(() => {
        if (!state || !state.map || state.map.config.visState.layers.length === 0) return;
        console.log("[Layers](MapLayers.useEffect[state]) Map Layers", state);
        const newLayers: LayerToggleProps[] = [];
        for (const layer of state.map.config.visState.layers) {
            console.log("Layer", layer);
            newLayers.push({id: layer.id, text: layer.config.label, icon: FaCircleExclamation, isEnabled: layer.config.isVisible, onToggle: () => {}});
        }
        setLayers(newLayers);
    }, [state]);

    return <div id="map-layers" className="top-bar-container top-bar">
        {layers.map((layer) => <LayerPill key={layer.id} {...layer} onToggle={() => handleToggle(layer.id)} />)}
    </div>;
}

export const LayerPill = (props: LayerToggleProps) => {
    const classes = `button ${props.isEnabled ? 'enabled' : 'disabled'}`;
    return <div className={classes} onClick={props.onToggle}>
        <span>{props.text}</span>
        <props.icon />
    </div>;
}
