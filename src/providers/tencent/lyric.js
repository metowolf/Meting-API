import { changeUrlQuery } from "./util.js"

const get_lyric = async (songmid, cookie = '') => {
    const data = {
        songmid,
        pcachetime: new Date().getTime(),
        g_tk: 5381,
        loginUin: 0,
        hostUin: 0,
        inCharset: 'utf8',
        outCharset: 'utf-8',
        notice: 0,
        platform: 'yqq',
        needNewCode: 0,
        format: "json"
    }


    const headers = {
        Referer: 'https://y.qq.com',
    }

    const url = changeUrlQuery(data, 'http://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg')

    let result = await fetch(url, { headers });

    result = await result.json()

    result.lyric = decodeURIComponent(escape(atob(result.lyric || '')));
    result.trans = decodeURIComponent(escape(atob(result.trans || '')));

    const res = { lyric: result.lyric, tlyric: result.trans }
    return res;
}


// const res = await get_lyric('000i26Sh1ZyiNU')
// console.log(res)

export { get_lyric }
