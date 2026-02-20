import app from "../app.js"

async function writeReadableStreamToWritable(stream, writable) {
    let reader = stream.getReader()

    async function read() {
        let { done, value } = await reader.read()

        if (done) {
            writable.end()
            return
        }

        writable.write(value)

        await read()
    }

    try {
        await read()
    } catch (error) {
        writable.destroy(error)
        throw error
    }
}

class NodeResponse extends Response {
    get headers() {
        return super.headers
    }

    clone() {
        return super.clone()
    }
}
const getRequestListener = (fetchCallback) => {
    return async (incoming, outgoing) => {
        const method = incoming.method || 'GET'
        const url = `http://${incoming.headers.host}${incoming.url}`

        const headerRecord = {}
        const len = incoming.rawHeaders.length
        for (let i = 0; i < len; i++) {
            if (i % 2 === 0) {
                const key = incoming.rawHeaders[i]
                headerRecord[key] = incoming.rawHeaders[i + 1]
            }
        }

        const init = {
            method: method,
            headers: headerRecord,
        }

        if (!(method === 'GET' || method === 'HEAD')) {
            const buffers = []
            for await (const chunk of incoming) {
                buffers.push(chunk)
            }
            const buffer = Buffer.concat(buffers)
            init['body'] = buffer
        }

        let res

        try {
            res = (await fetchCallback(new Request(url.toString(), init)))
        } catch {
            res = new NodeResponse(null, { status: 500 })
        }

        const contentType = res.headers.get('content-type') || ''
        const contentEncoding = res.headers.get('content-encoding')

        for (const [k, v] of res.headers) {
            if (k === 'set-cookie') {
                outgoing.setHeader(k, res.headers.getAll(k))
            } else {
                outgoing.setHeader(k, v)
            }
        }
        outgoing.statusCode = res.status

        if (res.body) {
            if (!contentEncoding && contentType.startsWith('text')) {
                outgoing.end(await res.text())
            } else if (!contentEncoding && contentType.startsWith('application/json')) {
                outgoing.end(await res.text())
            } else {
                await writeReadableStreamToWritable(res.body, outgoing)
            }
        } else {
            outgoing.end()
        }
    }
}

export default getRequestListener(app.fetch)
