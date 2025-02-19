export interface IOscClient {
  connect(oscServer: IOscServer): Promise<string>
}

export interface IOscServer {
  bridge(host: string, port: number): Promise<string>
  getConnectAddress(): string
  getReplyAddress(originalAddress: string): string
}
