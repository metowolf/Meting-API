import { request } from "./util.js"
import { map_song_list } from "./util.js"

export const get_artist_songs = async (id, cookie) => {
    id = parseInt(id)
    const data = {
        id,
    }

    const res = await request('POST', `https://music.163.com/api/artist/top/song`, data, {
        crypto: 'weapi',
        cookie: {},
    })

    return map_song_list(res)

}

// const res = await get_artist_songs("12441107");
// console.log(res)
