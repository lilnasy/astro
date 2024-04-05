import type * as ws from 'ws';

/**
 * Custom class because WHATWG Response objects can't have a status of 101.
 */
export class UpgradeResponse extends Response {
	readonly status = 101
}

interface WebSocketEventMap {
    "close": ws.CloseEvent
    "error": ws.ErrorEvent
    "message": ws.MessageEvent
    "open": ws.Event
}

export class WebSocket {
    // make `ws instanceof EventTarget` checks pass
    static { Object.setPrototypeOf(this.prototype, EventTarget.prototype) }
    
    // the half-web-compatible WebSocket implementation of "ws"
    #ws: ws.WebSocket | undefined
    
    // keep track of added event listeners and send calls until the ws instance is attached
    #pendingActions: Array<() => void> | null = []

    static attach(standard: WebSocket, ws: ws.WebSocket) {
        if (standard.#ws) throw new Error("WebSocket already attached")
        
        ws.binaryType = "arraybuffer"

        // TODO handlers can be added or removed after attachment
        ws.onclose = standard.onclose
        ws.onerror = standard.onerror
        ws.onmessage = standard.onmessage
        ws.onopen = standard.onopen

        standard.#ws = ws
        
        for (const action of standard.#pendingActions!) action()
        standard.#pendingActions = null
        
        return standard
    }

    // WHATWG WebSocket doesnt do "nodebuffer", ws.WebSocket doesnt do "blob"
    // leaving only "arraybuffer" as the only common type 
    readonly binaryType = "arraybuffer" as const
    
    get bufferedAmount() {
        return this.#ws?.bufferedAmount ?? 0
    }

    get extensions() {
        return this.#ws?.extensions ?? ''
    }

    get protocol() {
        return this.#ws?.protocol ?? ''
    }

    get readyState() {
        return this.#ws?.readyState ?? this.CONNECTING
    }

    get url() {
        return this.#ws?.url ?? ''
    }

    readonly CONNECTING = 0 as const
    readonly OPEN = 1 as const
    readonly CLOSING = 2 as const
    readonly CLOSED = 3 as const
    
    onclose: ws.WebSocket["onopen"] = null
    onerror: ws.WebSocket["onerror"] = null
    onmessage: ws.WebSocket["onmessage"] = null
    onopen: ws.WebSocket["onopen"] = null

    close() {
        if (this.#ws) this.#ws.close()
        else this.#pendingActions!.push(() => this.#ws!.close())
    }

    send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        if (this.#ws) send(this.#ws, data)
        else this.#pendingActions!.push(() => send(this.#ws!, data))
    }

    addEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: ws.EventListenerOptions) {
        if (this.#ws) this.#ws.addEventListener(type as any, listener as any, options)
        else this.#pendingActions!.push(() => this.#ws!.addEventListener(type as any, listener as any, options))
    }

    removeEventListener<K extends keyof WebSocketEventMap>(type: K, listener: EventListenerOrEventListenerObject | ((this: WebSocket, ev: WebSocketEventMap[K]) => any)) {
        if (this.#ws) this.#ws.removeEventListener(type as any, listener as any)
        else this.#pendingActions!.push(() => this.#ws!.removeEventListener(type as any, listener as any))
    }

    /** `ws` does not implement dispatchEvent. Always returns `false`. */
    dispatchEvent() {
        return false as const
    }
}

function send(ws: ws.WebSocket, data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (data instanceof Blob) data.arrayBuffer().then(buffer => ws.send(buffer))
    else ws.send(data)
}
