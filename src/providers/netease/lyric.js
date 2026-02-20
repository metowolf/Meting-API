import { request } from "./util.js"

export const get_lyric = async (id, cookie) => {
    // query.cookie.os = 'ios'

    const data = {
        id: id,
        tv: -1,
        lv: -1,
        rv: -1,
        kv: -1,
    }
    const res = await request(
        'POST',
        `https://music.163.com/api/song/lyric?_nmclfl=1`,
        data,
        {
            crypto: 'api',
        },
    )

    return {
        lyric: res.lrc?.lyric || '',
        tlyric: res.tlyric?.lyric || ''
    }
}

// const res = await get_lyric('2015217630')
// console.log(res)