import { get_playlist } from "./playlist.js";
import { get_song_url, get_song_info, get_pic } from "./song.js";
import { get_lyric } from "./lyric.js"

const support_type = ['url', 'pic', 'lrc', 'song', 'playlist']

const handle = async (type, id, cookie = '') => {
    let result;
    switch (type) {
        case 'lrc':
            result = await get_lyric(id)
            break
        case 'pic':
            result = await get_pic(id)
            break
        case 'url':
            result = await get_song_url(id)
            break
        case 'song':
            result = await get_song_info(id)
            break
        case 'playlist':
            result = await get_playlist(id)
            break
        default:
            return -1;
    }
    return result
}

export default {
    register: (ctx) => {
        ctx.register('tencent', { handle, support_type })
    }
}
