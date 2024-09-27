/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
    readonly PUBLIC_FACTORY: string
    readonly PUBLIC_DO_MATH: string
    readonly PUBLIC_DO_MATH_POLICY: string
    readonly PUBLIC_NATIVE: string
    readonly PUBLIC_PASSPHRASE: string
    readonly PUBLIC_RPC_URL: string
    readonly PUBLIC_LAUNCHTUBE_URL: string
    readonly PUBLIC_LAUNCHTUBE_JWT: string
    readonly PUBLIC_MERCURY_URL: string
    readonly PUBLIC_MERCURY_JWT: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }