import { Line } from "../data/repositories/scripts"
import { IOscClient, IOscMessage } from "./i-osc"

export interface ITarget {
  host?: string,
  port?: number,
  password?: string,
}

export interface ICueApp {
  name: string
  // push(...bundles: ICueCommandBundle[]): Promise<string[]>
  // pull(...ids: string[]): Promise<ICueCommandBundle[]>
}

export interface ICues extends Iterable<ICue> {
  add(...lines: Line[]): ICue[]
}

export interface ICue {
  name: string
  id: string
  type: string
  notes?: string
  mode?: number
  range?: [location: number, length: number]
  cues?: ICue[]

  getActions(oscClient: IOscClient): IOscMessage[]
}

export interface ICueCommandBundle {
  mappingByCueNumber: Record<number, string>
  addFromCue(cue: ICue): this
}

