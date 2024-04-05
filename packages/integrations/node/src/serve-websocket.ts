import * as ws from 'ws';
import { NodeApp } from 'astro/app/node';
import { UpgradeResponse, WebSocket } from './websocket.js';

type UpgradeHandler =
    import("node:http").Server["on"] extends
        (event: "upgrade", callback: infer UpgradeHandler) => unknown
            ? UpgradeHandler
            : never

export function createWebsocketHandler(app: NodeApp): UpgradeHandler {
    const server = new ws.WebSocketServer({ noServer: true })
    return async (req, socket, head) => {
        let websocket: WebSocket

        const response = await app.render(NodeApp.createRequest(req), {
            addCookieHeader: true,
            locals: {
                async upgradeWebSocket() {
                    websocket = new WebSocket
                    return { socket: websocket, response: new UpgradeResponse }
                }
            }
        })

        if (response instanceof UpgradeResponse) {
            server.handleUpgrade(req, socket, head, ws => WebSocket.attach(websocket, ws))
        } else {
            // The "upgrade" event callback doesn't provide a response object.
            // The http data must be manually streamed out.
            // Abruptly closing the connection here is a substitute for re-implementing the HTTP protocol.
            socket.destroy()
        }
	}
}
