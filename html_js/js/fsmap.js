import { createMap } from "https://corsproxy.io/?key=3d648870&url=https://cdn.jsdelivr.net/npm/@foursquare/map-sdk@latest/dist/index.js";

const map = await createMap({
  apiKey: "fsq3CYDP77ybwoo1KtkJigGRj6g0uYyhWVw25jM+zN6ovbI=",
  container: document.getElementById("map-container"),
  // this loads a published map
  // (original url: https://studio.foursquare.com/public/806b95d0-36bb-402c-b16c-24e54af4a761)
  initialState: {
    publishedMapId: "ffc494e8-2565-4dfc-be79-bd4d105ee578",
  },
});
globalThis.map = map;
