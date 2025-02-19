export interface IOscClient {
  connect(oscServer: IOscServer): Promise<string>
}

export interface IOscServer {
  bridge(host: string, port: number): Promise<string>
  dict: Record<string, { address: string }>
}
