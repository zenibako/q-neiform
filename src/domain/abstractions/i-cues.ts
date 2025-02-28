import { Line } from "../../data/repositories/scripts"
import { IOscDictionary } from "./i-osc"

export interface ICueApp {
  name: string
  // push(...bundles: ICueCommandBundle[]): Promise<string[]>
  // pull(...ids: string[]): Promise<ICueCommandBundle[]>
}

export interface ICues extends Iterable<ICue> {
  getSourceName(): string,
}

export interface ICue {
  id?: string | null,
  name: string,
  // number: string,
  type: string,
  lines: Line[]
  // color: string,
  // mode: string,
  // address: string

  clearActions(): void
  getActions(dict: IOscDictionary): ICueAction[]
}

export interface ICueAction {
  address?: string
  args: (string | number)[]
}

export interface ICueCommandBundle {
  mappingByCueNumber: Record<number, string>
  addFromCue(cue: ICue): this
}

