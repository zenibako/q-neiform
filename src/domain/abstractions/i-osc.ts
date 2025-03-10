export interface IOscClient {
  open(): Promise<void>
  connect(): Promise<void>
  send(...messages: (IOscMessage | IOscBundle)[]): void
  sendAndWaitForReply(...messages: (IOscMessage | IOscBundle)[]): Promise<string | null>
  getDictionary(): IOscDictionary
  getTargetAddress(address: string): string
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
  //selectedCues: IOscDictionaryEntry,
  name: IOscDictionaryEntry,
  mode: IOscDictionaryEntry,
  [index: string]: IOscDictionaryEntry
}

export interface IOscServer {
  id?: string
  connect(): Promise<string>
  getDictionary(): IOscDictionary
  setId(replyResponse: string): void
  getTargetAddress(address?: string): string
}

export interface IOscMessage {
  address: string,
  args: (string | number)[]
}

export interface IOscBundle {
  messages: IOscMessage[]
}
