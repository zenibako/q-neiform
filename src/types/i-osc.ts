export interface IOscClient {
  initialize(): Promise<IOscClient>
  send(...messages: IOscMessage[]): Promise<IOscMessage[]>
  getDictionary(): IOscDictionary
  getTargetAddress(address?: string): string
}

export interface IOscDictionaryEntry {
  address: string,
  hasReply?: boolean,
  replyDataExample?: string
}

export interface IOscDictionary {
  cue: IOscDictionaryEntry
  connect: IOscDictionaryEntry
  reply: IOscDictionaryEntry
  workspace: IOscDictionaryEntry
  new: IOscDictionaryEntry
  name: IOscDictionaryEntry
  mode: IOscDictionaryEntry
  [index: string]: IOscDictionaryEntry
}

export interface IOscServer {
  id?: string
  host: string
  port: string
  getDictionary(): IOscDictionary
  setIdFromConnectResponse(message: IOscMessage): void
  getTargetAddress(address?: string): string
  getReplyAddress(address?: string): string
}

export interface IOscMessage {
  address: string
  args: (string | number)[]
  listenOn?: string
}
