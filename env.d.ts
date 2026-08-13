/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEXIE_CLOUD_DB_URL: string
  readonly VITE_DEXIE_CLOUD_SIGNUP_OPEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
