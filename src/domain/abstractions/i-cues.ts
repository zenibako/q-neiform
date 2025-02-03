export interface ICueApp {
  name: string

  initialized: boolean
  initialize(): Promise<void>

  push(...bundles: ICueCommandBundle[]): Promise<string[]>
  pull(...ids: string[]): Promise<ICueCommandBundle[]>
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

