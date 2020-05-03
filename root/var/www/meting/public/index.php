<?php

require '../Meting/src/Meting.php';
require '../Cache/autoload.php';

use Metowolf\Meting;
use Gregwar\Cache\Cache;

function handler($server, $type, $id, $auth, $base)
{
    if (empty($id) || !in_array($server, ['netease','tencent','baidu','xiami','kugou']) || !in_array($type, ['song','album','search','artist','playlist','lrc','url','pic'])) {
        return [
            'status' => 400
        ];
    }

    if (in_array($type, ['lrc','url','pic'])) {
        $token = auth($server . $type . $id);
        if ($token != $auth) {
            return [
                'status' => 403
            ];
        }
    }

    $file = md5($server.$type.$id.$base) . '.json';
    $cache = new Cache;
    $cache->setCacheDirectory('/tmp/cache');
    $data = $cache->getOrCreate(
        $file,
        [
            'max-age' => ($type == 'url') ? 600 : 36000,
        ],
        function () use ($server, $type, $id, $base, $cache, $file) {
            $t = __handler($server, $type, $id, $base);
            return json_encode($t);
        }
    );
    return json_decode($data, true);
}

function __handler($server, $type, $id, $base)
{
    if (empty($id)) {
        return [
            'status' => 400
        ];
    }

    if (!in_array($server, ['netease','tencent','baidu','xiami','kugou'])) {
        return [
            'status' => 400
        ];
    }

    if (!in_array($type, ['song','album','search','artist','playlist','lrc','url','pic'])) {
        return [
            'status' => 400
        ];
    }


    $api = new Meting($server);
    $api->format(true);

    if ($type == 'lrc') {
        $data = $api->lyric($id);
        $data = json_decode($data, true);
        return [
            'status' => 200,
            'content-type' => 'text/plain; charset=utf-8',
            'body' => lrctran($data['lyric'], $data['tlyric'])
        ];
    }

    if ($type == 'pic') {
        $data = $api->pic($id, 90);
        $data = json_decode($data, true);
        return [
            'status' => 302,
            'url' => $data['url']
        ];
    }

    if ($type == 'url') {
        $data = $api->url($id, 320);
        $data = json_decode($data, true);
        $url = $data['url'];

        if ($server == 'netease') {
            $url = str_replace('://m7c.', '://m7.', $url);
            $url = str_replace('://m8c.', '://m8.', $url);
            $url = str_replace('http://m7.', 'https://m7.', $url);
            $url = str_replace('http://m8.', 'https://m7.', $url);
            $url = str_replace('http://m10.', 'https://m10.', $url);
        }
        if ($server == 'tencent') {
            $url = str_replace('http://', 'https://', $url);
            $url = str_replace('ws.stream.qqmusic.qq.com', 'dl.stream.qqmusic.qq.com', $url);
        }
        if ($url == 'xiami') {
            $url = str_replace('http://', 'https://', $url);
        }
        if ($server == 'baidu') {
            $url = str_replace('http://zhangmenshiting.qianqian.com', 'https://gss3.baidu.com/y0s1hSulBw92lNKgpU_Z2jR7b2w6buu', $url);
        }

        if (empty($url)) {
            return [
                'status' => 404
            ];
        }

        return [
            'status' => 302,
            'url' => $url
        ];
    }

    $data = $api->$type($id);
    $data = json_decode($data, true);
    $music = [];
    foreach ($data as $vo) {
        $music[] = array(
            'title'  => $vo['name'],
            'author' => implode(' / ', $vo['artist']),
            'url'    => $base.'?server='.$vo['source'].'&type=url&id='.$vo['url_id'].'&auth='.auth($vo['source'].'url'.$vo['url_id']),
            'pic'    => $base.'?server='.$vo['source'].'&type=pic&id='.$vo['pic_id'].'&auth='.auth($vo['source'].'pic'.$vo['pic_id']),
            'lrc'    => $base.'?server='.$vo['source'].'&type=lrc&id='.$vo['lyric_id'].'&auth='.auth($vo['source'].'lrc'.$vo['lyric_id']),
        );
    }

    return [
        'status' => 200,
        'content-type' => 'application/json',
        'body' => json_encode($music)
    ];
}

function auth($name)
{
    return hash_hmac('sha1', $name, getenv('AUTH_SECRET') ?? ('meting-secret-' . getenv('HOSTNAME')));
}

function lrctrim($lyrics)
{
    $result = "";
    $lyrics = explode("\n", $lyrics);
    $data = array();
    foreach ($lyrics as $lyric) {
        preg_match('/\[(\d{2}):(\d{2}\.?\d*)]/', $lyric, $lrcTimes);
        $lrcText = preg_replace('/\[(\d{2}):(\d{2}\.?\d*)]/', '', $lyric);
        if (empty($lrcTimes)) {
            continue;
        }
        $lrcTimes = intval($lrcTimes[1]) * 60000 + intval(floatval($lrcTimes[2]) * 1000);
        $lrcText = preg_replace('/\s\s+/', ' ', $lrcText);
        $lrcText = trim($lrcText);
        $data[] = array($lrcTimes, $lrcText);
    }
    sort($data);
    return $data;
}

function lrctran($lyric, $tlyric)
{
    $lyric = lrctrim($lyric);
    $tlyric = lrctrim($tlyric);
    $len1 = count($lyric);
    $len2 = count($tlyric);
    $result = "";
    for ($i = 0, $j = 0; $i < $len1 && $j < $len2; $i++) {
        while ($lyric[$i][0] > $tlyric[$j][0] && $j + 1 < $len2) {
            $j++;
        }
        if ($lyric[$i][0] == $tlyric[$j][0]) {
            $tlyric[$j][1] = str_replace('/', '', $tlyric[$j][1]);
            if (!empty($tlyric[$j][1])) {
                $lyric[$i][1] .= " ({$tlyric[$j][1]})";
            }
            $j++;
        }
    }
    for ($i = 0; $i < $len1; $i++) {
        $t = $lyric[$i][0];
        $result .= sprintf("[%02d:%02d.%03d]%s\n", $t / 60000, $t % 60000 / 1000, $t % 1000, $lyric[$i][1]);
    }

    return $result;
}

function main()
{
    $server = $_GET['server'] ?? 'netease';
    $type = $_GET['type'] ?? 'search';
    $id = $_GET['id'] ?? 'hello';
    $auth = $_GET['auth'] ?? '';
    $base = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . strtok($_SERVER['REQUEST_URI'], '?');

    $result = handler($server, $type, $id, $auth, $base);

    if ($result['status'] >= 400) {
        http_response_code($result['status']);
        return;
    }

    header("Access-Control-Allow-Origin: *");

    if ($result['status'] >= 300) {
        header('Location: ' . $result['url']);
        return;
    }

    if ($result['status'] >= 200) {
        header("Content-Type: " . $result['content-type']);
        echo $result['body'];
        return;
    }
}

main();
