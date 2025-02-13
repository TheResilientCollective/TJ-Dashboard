import { FC, useEffect, useRef, useState } from "react";
import { createMap, MapApi } from "@foursquare/map-sdk";

export const App: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapApi | null>(null);

  useEffect(() => {
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
        }
      });

      setMap(map);
    };

    initMap();
  }, []);

  useEffect(() => {
    map && console.log(map.getMapConfig());
    if (map) {
      map.setTheme({
        preset: "light",
      })
      map.setMapConfig({
        version: "v1",
        config: {
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
            // threeDBuildingColor: [
            //   9.665468314072013,
            //   17.18305478057247,
            //   31.1442867897876
            // ],
            backgroundColor: [
              255,
              255,
              255
            ],
            mapStyles: {
            }
          }
        }
      });
      // map.setView({
      //   latitude: 36.7045671093519,
      //   longitude: -122.47582941779496,
      //   zoom: 5.920306814575524,
      // });

      // hide legend by default
      // map.setLegendVisibility(false);
    }
  }, [map]);

  return <div id="map-container" ref={containerRef}></div>;
};
