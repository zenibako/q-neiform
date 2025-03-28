import { IMenuItem, Menu } from "../../../domain/entities/menu"
import { IRange, IScriptData, IScriptEditor, IScriptLine, IScriptStorage } from "../../../types/i-script"
import ILogger from "../../../types/i-logger"
import OSC from "osc-js"
import { BeatLine, BeatRange, BeatTagType } from "../../../types/beat/beat-types"
import BeatTags, { BeatTagQuery } from "./tags"

export enum Mode { DEVELOPMENT, PRODUCTION }

const WS_DEFAULT_ADDRESS = "localhost"
const WS_DEFAULT_PORT = "8080"

export default class BeatPlugin implements IScriptEditor, IScriptData, IScriptStorage, ILogger {
  get serverConfiguration(): { host: string, port: string, password: string } {
    const config = Beat.getDocumentSetting("server") ?? {}
    if (!config.host || !config.port) {
      const { address: modalHost, port: modalPort } = this.promptUserForServerInfo()
      config.host = modalHost?.length ? modalHost : WS_DEFAULT_ADDRESS
      config.port = modalPort?.length ? modalPort : WS_DEFAULT_PORT
    }

    if (!config.password) {
      const { password: modalPassword } = this.promptUserForPassword()
      config.password = modalPassword
    }

    this.serverConfiguration = config
    return config
  }

  private set serverConfiguration(server: {
    host?: string | null,
    port?: string | null,
    password?: string | null
  }) {
    Beat.setDocumentSetting("server", server)
  }

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

  async getFountainText(): Promise<string | null> {
      return null
  }

  async getYamlCues(): Promise<string | null> {
      return null
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
      .map(({ range: [location, length] }) => ({ location, length }))
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

  private getScriptAppLine(beatLine: BeatLine): IScriptLine {
    const serializedBeatLine = beatLine.forSerialization()
    return {
      string: serializedBeatLine.string as string,
      typeAsString: serializedBeatLine.typeAsString as string,
      range: serializedBeatLine.range as IRange,
      cueId: beatLine.getCustomData("cue_id")
    }
  }

  private getAlertInfo(status: number, error?: string) {
    const tryAgainMessage = "Try again. Is \"q-neiform bridge serve\" running?"
    switch (status) {
      case OSC.STATUS.IS_NOT_INITIALIZED:
        return {
          title: "Initialization Error",
          message: tryAgainMessage
        }
      case OSC.STATUS.IS_CONNECTING:
        return {
          title: "Connection Error",
          message: tryAgainMessage
        }
      default:
        return {
          title: error ? "Server Error" : "Unknown Error",
          message: error ?? "Closing plugin. Reopen and try again."
        }
    }
  }
}
