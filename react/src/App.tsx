import { useEffect, useRef, useState } from "react";
import { createMap, MapApi, View } from "@foursquare/map-sdk";
import { useGlobalState } from './GlobalState';

// the number of layers that should be loaded into the map
// since the data is loaded asynchronously, and no onload event is available,
// we manually check for the number of layers to determine when the data is loaded
const EXPECTED_NUMBER_OF_LAYERS = 6;

export const App = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapApi | null>(null);
  const {state, setState} = useGlobalState();
  const [dataLoaded, setDataLoaded] = useState(false);

  /**
   * Initializes the map with the provided API Key and container reference.
   * The map will begin loading data from the provided map ID.
   */
  const initMap = async () => {
    const map = await createMap({
      // This is an API Key that only works for these examples.
      // Provide your own Map SDK API Key instead.
      // For more details, see: https://docs.foursquare.com/developer/docs/studio-map-sdk-authentication
      //apiKey: "fsq3CYDP77ybwoo1KtkJigGRj6g0uYyhWVw25jM+zN6ovbI=",
      apiKey: import.meta.env.VITE_FOURSQUARE_API_KEY,
      container: containerRef.current!,
      initialState: {
        publishedMapId:  import.meta.env.VITE_FOURSQUARE_MAP
      },
      // uiConfig: {
      //   sidePanel: {
      //     view: 'hidden',
      //     isAddLayerVisible: false
      //   },
      //   exportEnabled: false,
      // },
    });
    map.setTheme({
      preset: "light",
    });
    map.setMapConfig({
      version: "v1",
      config: {
        loaded: false,
        mapStyle: {
          styleType: "light",
          topLayerGroups: {},
          visibleLayerGroups: {
            label: true,
            road: true,
            border: true,
            building: false,
            water: true,
            land: true,
            "3d building": false
          },
          mapStyles: {
          }
        }
      }
    });
    map

    map.eventHandlers.onViewUpdate = (view:View) => {
      getMapRegion(view);
    };

    // save variables
    setMap(map);
    // udpate the global state with the map config
    setState((prevState: any) => {
      const newState = {...prevState};
      newState.map = map?.getMapConfig();
      return newState;
    });
  };

  /**
   * Updates the map visuals in response to changes in the global state.
   * e.g. when GUI filters are changed, update the map with the new filters
   */
  const updateMap = () => {
    console.log("[App](App.updateMap) data loaded", dataLoaded);
    if (!map || !state || !dataLoaded) return;

    // update the map configuration to match the global state
    const config = map.getMapConfig() as any;
    const newConfig = {...config};
    newConfig.config.visState = state.map.config.visState;
    // newConfig.uiState = state.map.config.uiState;
    // newConfig.mapStype = state.map.config.mapStyle;
    map.setMapConfig(newConfig);
  };

  /**
   * Get the map region (e.g. "Imperial Beach") from the current view.
   * This is used to determine what data to show in the side panel.
   * @param view The current view of the map
   */
  const getMapRegion = (view: View) => {
    // TODO: get the SRA from the current map view
    // setState((prevState: any) => {
    //   if (prevState.viewport && prevState.viewport === view) return prevState;
    //   const newState = {...prevState};
    //   newState["viewport"] = view;
    //   return newState;
    // });
    console.log(view) // here to keep vite build from complaining
  }

  /**
   * Checks if the map data has been loaded into the map.
   * This is necessary because the data is loaded asynchronously and there are no onload events.
   * This function will update the global state with the map data once it is loaded.
   * implementation note: this function is a recursive loop that checks for the data every frame.
   * @returns A cleanup function to stop the loop
   */
  const checkForMapDataLoaded = () => {
    let animationFrameId: number;
    const frameLoop = async () => {
      // wait for map to be initialized
      if (!map) {
        animationFrameId = requestAnimationFrame(frameLoop);
        return;
      }
      // break loop if data is already loaded
      if (dataLoaded) {
        console.log("[App](App.checkForMapDataLoaded) Data already loaded. Breaking loop", state.map.config);
        cancelAnimationFrame(animationFrameId);
        return;
      }

      // Check if the data is loaded
      const config = map.getMapConfig() as any;
      if (config.config.visState.layers.length === EXPECTED_NUMBER_OF_LAYERS) {
        console.log("[App](App.checkForMapDataLoaded) Data loaded to map", config.config);
        // update the global state with the map data
        await setState((prevState: any) => {
          const newState = {...prevState};
          newState.map.config = config.config;
          console.log("[App](App.checkForMapDataLoaded) Updated global state", newState);
          return newState;
        });
        setDataLoaded(true);
        return;
      }
      else {
        // keep looping until data is loaded
        animationFrameId = requestAnimationFrame(frameLoop);
        return;
      }
    };

    // Start the loop
    animationFrameId = requestAnimationFrame(frameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  };

  // Initialize the map when the component mounts (data won't immediately load)
  useEffect(() => {
    initMap();
  }, [ setState, setMap ]);
  // update the map whenever the global state changes
  useEffect(updateMap, [state, dataLoaded, map]);
  // check if the map data has been loaded
  useEffect(checkForMapDataLoaded, [map, dataLoaded, setDataLoaded, setState]);

  return <div id="map-container" ref={containerRef}></div>;
};
