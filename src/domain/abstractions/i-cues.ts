export interface ICueData {
    initialized: boolean

    initialize(): Promise<void>
    send(...bundles: ICueCommandBundle[]): Promise<string[]>
}

export interface ICue {
  color: string
}

export interface ICueCommandBundle {
    mappingByCueNumber: Record<number, string> 
    addFromCue(cue: ICue): this
}

