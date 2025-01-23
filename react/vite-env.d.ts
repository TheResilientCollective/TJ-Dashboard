interface ImportMetaEnv {
  readonly VITE_FOURSQUARE_API_KEY: string;
  readonly VITE_FOURSQUARE_MAP: string;

}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
