declare namespace osc {
  class WebSocketPort {
    open(): void
    on(message: string, callback: (input: OscPacket) => void): void
    on(message: string, callback: (input: string) => void): void
    on(message: string, callback: (oscMsg: object, timeTag: object, info: object) => void): void
    close(): void
    constructor({ url: string, metadata: boolean })
  }
}
