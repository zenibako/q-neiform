import { IMenuItem, Menu } from "../../../domain/entities/menu"
import { IRange, IScriptApp, IScriptAppLine } from "../../../types/i-script"
import ILogger from "../../../types/i-logger"
import { IOscClient, IOscDictionary, IOscMessage, IOscServer } from "../../../types/i-osc"
import OSC from "osc-js"
import BeatWebSocketWindow from "../beat/window"
import { OSC_DICTIONARY, QLabWorkspace } from "../qlab/workspace"
import { BeatLine, BeatRange, BeatTagType } from "../../../types/beat/beat-types"
import BeatTags, { BeatTagQuery } from "./tags"

export enum Mode { DEVELOPMENT, PRODUCTION }

const WS_DEFAULT_ADDRESS = "localhost"
const WS_DEFAULT_PORT = "8080"

type ServerConfiguration = {
  host: string | null
  port: string | null
  password?: string | null
}

export default class BeatPlugin implements IScriptApp, IOscClient, ILogger {
  private window?: BeatWebSocketWindow
  private oscServer?: IOscServer

  constructor(private mode: Mode) {
    if (this.mode == Mode.DEVELOPMENT) {
      Beat.openConsole()
    }

    Beat.custom = {}
  }

  log(message: string) {
    Beat.log(message)
  }

  debug(message: string) {
    if (this.mode !== Mode.DEVELOPMENT) {
      return
    }

    Beat.log(message)
  }

  async initialize(): Promise<string> {
    await this.openWebSocket()
    await this.connectToBridge()
    return "Initialized successfully."
  }

  listenForSelection(callback?: ({ location, length }: IRange) => void): void {
    Beat.onSelectionChangeDisabled = false
    Beat.onSelectionChange((location: number, length: number) => {
      this.debug(JSON.stringify({
        character: Beat.currentLine.characterName(),
        id: Beat.currentLine.getCustomData("cue_id"),
        location,
        length
      }, null, 1))
      if (callback) {
        callback({ location, length })
      }
    })
  }

  stopListeningForSelection(): void {
    Beat.onSelectionChangeDisabled = true
  }

  colorMap = new Map<IRange, string>()
  toggleHighlight(color: string, range: IRange) {
    const currentColor = this.colorMap.get(range)
    const newColor = currentColor ? "" : color
    Beat.textBackgroundHighlight(newColor, range.location, range.length)
    if (newColor.length) {
      this.colorMap.delete(range)
    } else {
      this.colorMap.set(range, color)
    }
  }

  async send(...messages: IOscMessage[]): Promise<string[]> {
    if (!this.oscServer) {
      throw new Error("No OSC server found.")
    }

    return this.sendMessages(messages)
  }

  private async openWebSocket(): Promise<string> {
    let { host, port } = this.loadServerConfiguration()
    if (!host || !port) {
      const { address: modalHost, port: modalPort } = this.promptUserForServerInfo()
      host = modalHost?.length ? modalHost : WS_DEFAULT_ADDRESS
      port = modalPort?.length ? modalPort : WS_DEFAULT_PORT
      this.saveServerConfiguration({ host, port })
    }

    return new Promise((resolve, reject) => {
      try {
        this.window = new BeatWebSocketWindow(host!, port!, (osc) => {
          this.oscServer = new QLabWorkspace(osc as OSC, host!, port!, this)
          this.saveServerConfiguration({ host, port })
          resolve("Successfully opened connection.")
        })
      } catch (e) {
        this.saveServerConfiguration({ host: null, port: null })
        this.log("There was an error while opening the web socket.")
        reject(e)
      }
    })
  }

  private async connectToBridge(): Promise<string> {
    const { reply: { address: replyAddress }, connect } = OSC_DICTIONARY
    let { password } = this.loadServerConfiguration()
    if (!password) {
      password = this.promptUserForPassword()
    }

    try {
      const [connectResponse] = await this.sendMessages([{
        address: connect.address,
        args: [password!],
        listenOn: replyAddress + connect.address,
      }])
      if (!connectResponse) {
        throw new Error("No connect response")
      }
      this.oscServer?.setIdFromConnectResponse(connectResponse)
      this.saveServerConfiguration({ password })
      this.window?.updateStatusDisplay("Connected!")
      return "Successfully connected."
    } catch (e) {
      this.saveServerConfiguration({ password: null })
      this.closeWebSocket()
      throw e
    }
  }

  private closeWebSocket() {
    this.window?.close()
    this.debug("Closed open web socket.")
  }

  private promptUserForServerInfo() {
    const modalResponse = Beat.modal({
      title: "Connect to QLab.",
      info: "You must first run \"q-neiform bridge serve\" in Terminal to relay OSC messages between the cue server. Once you have done that, fill out the below (or leave blank for defaults), then click OK to connect.",
      items: [
        { type: "text", name: "address", label: "Address", placeholder: `${WS_DEFAULT_ADDRESS}` },
        { type: "text", name: "port", label: "Port", placeholder: `${WS_DEFAULT_PORT}` },
      ]
    })
    if (!modalResponse) {
      throw new Error("Modal cancelled.")
    }

    return modalResponse
  }

  private promptUserForPassword() {
    const passModalResponse = Beat.modal({
      title: "Connect to q-neiform OSC bridge.",
      info: `Enter the password in your cue server.`,
      items: [
        { type: "text", name: "password", label: "Password" }
      ]
    })

    if (!passModalResponse) {
      throw new Error("Password not provided")
    }
    return passModalResponse.password
  }


  getDictionary(): IOscDictionary {
    return OSC_DICTIONARY
  }

  getTargetAddress(address: string): string {
    if (!this.oscServer) {
      throw new Error("Cannot get target address. No OSC server available.")
    }
    return this.oscServer.getTargetAddress(address)
  }

  private loadServerConfiguration(): ServerConfiguration {
    return Beat.getDocumentSetting("server") as ServerConfiguration ?? {}
  }

  private saveServerConfiguration(server: {
    host?: string | null,
    port?: string | null,
    password?: string | null
  }) {
    const serverConfig = this.loadServerConfiguration()
    Object.assign(serverConfig, server)
    Beat.setDocumentSetting("server", serverConfig)
  }

  private async sendMessages(messages: IOscMessage[]): Promise<string[]> {
    if (!this.oscServer) {
      throw new Error("No OSC server found.")
    }

    const replyMessages = messages.filter(({ listenOn }) => !!listenOn)
    return new Promise((resolve, reject) => {
      let repliesRemaining = replyMessages.length
      const replyStrings: string[] = []
      this.window?.send(messages, (replyMessage) => {
        const { args } = replyMessage
        if (!args?.length) {
          throw new Error(`No args returned.`)
        }

        const [responseBody] = args as string[]
        if (!responseBody) {
          throw new Error("No response.")
        }
        const { status } = JSON.parse(responseBody)

        if (status === "denied") {
          Beat.alert("Access Issue", "Some or all of the messages were denied. Check logs for details.")
          this.window?.updateStatusDisplay("Access denied.")
          reject("Access revoked. Need to reopen plugin.")
        }

        if (status === "error") {
          this.window?.updateStatusDisplay("Errors while sending. Check logs for details.")
          reject("Send errors")
        }

        replyStrings.push(responseBody)
        repliesRemaining--
        if (repliesRemaining === 0) {
          return resolve(replyStrings)
        }
      })

      if (repliesRemaining === 0) {
        resolve([])
        return
      }

      Beat.log(`Waiting for replies:\n${replyMessages.map(({ listenOn: replyAddress }) => ` - ${replyAddress}`).join("\n")}`)
    })
  }

  setLineData(range: IRange, key: string, value: string | null) {
    this.debug(`Set custom data: ${key} = ${value}`)
    const line = Beat.currentParser.lineAtIndex(range.location)
    line.setCustomData(key, value ?? "")
  }

  setRangeColor(range: BeatRange, backgroundColor: string, foregroundColor?: string) {
    Beat.textBackgroundHighlight(backgroundColor, range.location, range.length)
    if (foregroundColor) {
      Beat.textHighlight(foregroundColor, range.location, range.length)
    }
  }

  getTaggedRanges(type?: BeatTagType, range?: IRange): IRange[] {
    return BeatTags.get({ type, range } as BeatTagQuery)
      .map(({ range: [ location, length ]}) => ({ location, length }))
  }

  pullOutline() {
    return Beat.outline()
  }

  mountMenu(menu: Menu) {
    const menuItems = menu.getMenuItems().map((item: IMenuItem) => {
      const { title, keyboardShortcuts, useCase } = item
      if (!title || !useCase) {
        return Beat.separatorMenuItem()
      }

      return Beat.menuItem(title, keyboardShortcuts ?? [], () => useCase.execute())
    })

    const beatMenu = Beat.menu(menu.title, menuItems)
    beatMenu.addItem(Beat.separatorMenuItem())
    beatMenu.addItem(Beat.menuItem("Watch Selection", ["ctrl", "w"], () => this.listenForSelection()))
    this.debug("Mounted menu items.")
  }

  getCurrentLine() {
    return this.getScriptAppLine(Beat.currentLine)
  }

  getSelectedLines() {
    const linesInRange = Beat.currentParser.linesInRange(Beat.selectedRange())
    return linesInRange
      .filter((line: BeatLine) => (line.forSerialization()["string"] as string)?.length)
      .map((line: BeatLine) => this.getScriptAppLine(line))
  }

  getLineFromIndex(index: number) {
    return this.getScriptAppLine(Beat.currentParser.lineAtIndex(index))
  }

  private getScriptAppLine(beatLine: BeatLine): IScriptAppLine {
    const serializedBeatLine = beatLine.forSerialization()
    return {
      string: serializedBeatLine.string as string,
      typeAsString: serializedBeatLine.typeAsString as string,
      range: serializedBeatLine.range as IRange,
      cueId: beatLine.getCustomData("cue_id")
    }
  }
}
