import { Line } from "../../data/repositories/scripts"
import { IOscDictionary, IOscMessage } from "./i-osc"

export interface ICueApp {
  name: string
  // push(...bundles: ICueCommandBundle[]): Promise<string[]>
  // pull(...ids: string[]): Promise<ICueCommandBundle[]>
}

export interface ICues extends Iterable<ICue> {
  getSourceName(): string,
}

export interface ICue {
  id: string | null,
  name: string,
  // number: string,
  type: string,
  lines: Line[]
  // color: string,
  // mode: string,
  // address: string

  getActions(dict: IOscDictionary): IOscMessage[]
}

export interface ICueCommandBundle {
  mappingByCueNumber: Record<number, string>
  addFromCue(cue: ICue): this
}

