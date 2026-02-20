const YT_API = globalThis?.Deno?.env?.get("YT_API") || globalThis?.process?.env?.YT_API

export {
    YT_API,
}
