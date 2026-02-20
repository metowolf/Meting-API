import { SPOTIFY_API } from "./config.js"
const support_type = ['song', 'playlist']

const handle = async (type, id, cookie = '') => {
    let result
    const query = `?server=spotify&type=${type}&id=${id}`
    if (support_type.includes(type)) {
        result = await fetch(SPOTIFY_API + query)
        result = await result.json()
    } else {
        result = -1
    }

    return result
}

export default {
    register: (ctx) => {
        ctx.register('spotify', { handle, support_type })
    }
}
