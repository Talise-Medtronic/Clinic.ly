/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_MEDTRONIC_GPT_TOKEN?: string
	readonly VITE_MEDTRONIC_GPT_MODEL?: string
	readonly VITE_MEDTRONIC_GPT_RESPONSES_URL?: string
	readonly VITE_MEDTRONIC_GPT_INSTRUCTIONS?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
