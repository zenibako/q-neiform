export interface IOscData {
  initialized: boolean

  initialize(): Promise<void>
  send(...bundles: ICueCommandBundle[]): Promise<string[]>
}

export interface ICue {
  number: string,
  name: string,
  type: string,
  color: string,
  id?: string,
}

export interface ICueCommandBundle {
  mappingByCueNumber: Record<number, string>
  addFromCue(cue: ICue): this
}

