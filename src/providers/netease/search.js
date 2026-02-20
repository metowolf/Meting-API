import { request } from "./util.js"
import { map_song_list } from "./util.js"

export const get_search_songs = async (id, cookie) => {

    const data = {
        s: id,
        type: 1, // 1: 单曲, 10: 专辑, 100: 歌手, 1000: 歌单, 1002: 用户, 1004: MV, 1006: 歌词, 1009: 电台, 1014: 视频
        limit: 30,
        offset: 0,
        total: true,
    }

    const res = await request('POST', `https://interface.music.163.com/eapi/cloudsearch`, data, {
        crypto: 'eapi',
        cookie: {},
        url: '/api/cloudsearch/pc'
    })

    return map_song_list(res.result)

}

// const res = await get_search_songs("KN33S0XXX");
// console.log(res)
