import config from "../../config.js"
import { get_song_url } from "./song.js"
import { changeUrlQuery } from "./util.js"

const get_playlist = async (id, cookie = '') => {
    const data = {
        type: 1,
        utf8: 1,
        disstid: id,
        loginUin: 0,
        format: 'json'
    }


    const headers = {
        Referer: 'https://y.qq.com/n/yqq/playlist',
    }

    const url = changeUrlQuery(data, 'http://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg')

    let result = await fetch(url, { headers });

    result = await result.json()
    result = result.cdlist[0].songlist

    let jsonp
    if (config.OVERSEAS) {
        const ids = result.map(song => song.songmid)
        jsonp = await get_song_url(ids.join(','))
    }
    const res = await Promise.all(result.map(async song => {
        let song_info = {
            author: song.singer.reduce((i, v) => ((i ? i + " / " : i) + v.name), ''),
            title: song.songname,
            pic: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${song.albummid}.jpg`,
            url: config.OVERSEAS ? '' : song.songmid,
            lrc: song.songmid,
            songmid: song.songmid,
        }
        return song_info
    }));

    if (config.OVERSEAS) res[0].url = jsonp
    return res;
}


// const res = await get_playlist('7326220405')
// console.log(res)

export { get_playlist }
