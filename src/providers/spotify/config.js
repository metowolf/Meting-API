const SPOTIFY_API = globalThis?.Deno?.env?.get("SPOTIFY_API")
    || globalThis?.process?.env?.SPOTIFY_API
    || globalThis?.Deno?.env?.get("YT_API")
    || globalThis?.process?.env?.YT_API

export {
    SPOTIFY_API,
}
