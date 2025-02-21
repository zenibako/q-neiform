import { Cue } from "../entities/cue"

export interface IOscClient {
  connect(oscServer: IOscServer): Promise<string>
  send(cue: Cue): Promise<Cue>
}

export interface IOscServer {
  bridge(host: string, port: number): Promise<string>
  dict: Record<string, { address: string }>
}
