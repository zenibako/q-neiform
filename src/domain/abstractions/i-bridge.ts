export interface IOscBridgeClient {
  connectToWebSocketServer(): Promise<unknown>
}

export interface IOscBridgeServer {
  bridgeToUdpServer(host: string, port: number): Promise<unknown>
}
