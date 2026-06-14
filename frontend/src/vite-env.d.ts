// This is a comment that tells the TypeScript compiler to use the vite/client types.
/// <reference types="vite/client" /> 

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}