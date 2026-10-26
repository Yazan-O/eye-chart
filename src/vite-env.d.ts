/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STUB_LETTERS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
