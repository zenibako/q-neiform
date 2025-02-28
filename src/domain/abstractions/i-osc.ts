import { ICue, ICues } from "./i-cues"

export interface IOscClient {
  connect(oscServer: IOscServer): Promise<string>
  sendCue(cue: ICue): Promise<ICue>
  sendCues(cues: ICues): Promise<ICues>
}

export interface IOscDictionaryEntry {
  address: string,
  replyDataExample?: string
}

export interface IOscDictionary {
  connect: IOscDictionaryEntry,
  reply: IOscDictionaryEntry,
  workspace: IOscDictionaryEntry,
  new: IOscDictionaryEntry,
  selectedCues: IOscDictionaryEntry,
  name: IOscDictionaryEntry,
  [index: string]: IOscDictionaryEntry
}

export interface IOscServer {
  id?: string
  bridge(host: string, port: number): Promise<string>
  dict: IOscDictionary
  getTargetAddress(address?: string): string
}
