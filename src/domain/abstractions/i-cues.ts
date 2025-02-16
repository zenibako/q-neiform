import OscPort from "../../data/transfer-objects/osc-adapter"

export interface ICueApp {
  name: string
  host: string
  port: number
  connect(osc: OscPort, password?: string): Promise<void>
  isConnected(): boolean

  // push(...bundles: ICueCommandBundle[]): Promise<string[]>
  // pull(...ids: string[]): Promise<ICueCommandBundle[]>
}

export interface ICue {
  id?: string,
  number: string,
  name: string,
  type: string,
  color: string,
  mode: string,
  address: string
}

export interface ICueCommandBundle {
  mappingByCueNumber: Record<number, string>
  addFromCue(cue: ICue): this
}

