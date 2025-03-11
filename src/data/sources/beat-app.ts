import { IMenuItem, Menu } from "../../domain/entities/menu"
import { IRange, IScriptApp, IScriptAppLine } from "../../domain/abstractions/i-script"
import ILogger from "../../domain/abstractions/i-logger"
import { IOscClient, IOscDictionary, IOscMessage, IOscServer } from "../../domain/abstractions/i-osc"
import OSC from "osc-js"
import BeatWebSocketWindow from "../transfer-objects/beat-window"
import { OSC_DICTIONARY, QLabWorkspace } from "./qlab-app"

export enum Mode { DEVELOPMENT, PRODUCTION }

const WS_DEFAULT_ADDRESS = "localhost"
const WS_DEFAULT_PORT = "8080"

type ServerConfiguration = {
  host: string | null
  port: string | null
  password?: string | null
}

export default class BeatApp implements IScriptApp, IOscClient, ILogger {
  private window?: BeatWebSocketWindow
  private oscServer?: IOscServer
  private serverConfig: ServerConfiguration

  constructor(private mode: Mode) {
    if (this.mode == Mode.DEVELOPMENT) {
      Beat.openConsole()
    }


    Beat.onSelectionChange(() => {
      if (!this.oscServer) {
        return
      }

      // Beat.log(Beat.currentLine.characterName())
      // Beat.log(`Selection: loc = ${location} / len = ${length}`)
      const cueId = Beat.currentLine.getCustomData("cue_id")
      this.window?.updateStatusDisplay(`Cue ID: ${cueId?.length ? cueId : "None"}"`)
    })

    this.serverConfig = this.loadServerConfiguration()
    Beat.custom = {}
  }

  log(message: string) {
    Beat.log(message)
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

  handleError(error: string, status: number) {
    Beat.log(`Received error: ${JSON.stringify(error, null, 1)}`)
    const { title, message } = this.getAlertInfo(status)
    Beat.alert(title, message)
  }

  async open(): Promise<void> {
    const { host, port } = this.serverConfig
    if (!host || !port) {
      const { address: modalHost, port: modalPort } = this.promptUserForServerInfo()
      const host = modalHost?.length ? modalHost : WS_DEFAULT_ADDRESS
      const port = modalPort?.length ? modalPort : WS_DEFAULT_PORT
      Object.assign(this.serverConfig, { host, port })
      this.saveServerConfiguration(this.serverConfig)
    }

    return new Promise((resolve, reject) => {
      try {
        this.window = new BeatWebSocketWindow(host as string, port as string, (osc) => {
          this.oscServer = new QLabWorkspace(osc as OSC, this)
          resolve()
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  async connect(): Promise<string> {
    const { connect: { address } } = OSC_DICTIONARY
    if (!this.serverConfig.password) {
      const password = this.promptUserForPassword()
      Object.assign(this.serverConfig, { password })
    }

    try {
      const connectResponse = JSON.parse(
        await this.send({ address, args: [this.serverConfig.password!], hasReply: true })
      )
      this.oscServer?.setIdFromConnectResponse(connectResponse)
      this.saveServerConfiguration(this.serverConfig)
      this.window?.updateStatusDisplay("Connected to QLab.")
      return "Successfully connected."
    } catch (e) {
      this.saveServerConfiguration({ host: null, port: null })
      this.window?.close()
      throw e
    }
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

  private saveServerConfiguration(server: ServerConfiguration) {
    Beat.setDocumentSetting("server", server)
  }

  send(...messages: IOscMessage[]): Promise<string> {
    const { reply: replyDict } = OSC_DICTIONARY
    const replyMessages = messages.filter(({ hasReply }) => hasReply)
    return new Promise((resolve, reject) => {
      let repliesRemaining = replyMessages.length
      this.window?.send(messages, (replyMessage) => {
        const { args } = replyMessage as IOscMessage
        Beat.log(`Received send reply in plugin! ${JSON.stringify(replyMessage, null, 1)}`)
        if (!args?.length) {
          throw new Error(`No args returned.`)
        }

        const [responseBody] = args
        const responseBodyString = JSON.stringify(responseBody)
        const { status } = JSON.parse(responseBodyString)

        if (status === "denied") {
          Beat.alert("Access Issue", "Some or all of the messages were denied. Check logs for details.")
          this.window?.updateStatusDisplay("Access denied.")
          reject("Access revoked. Need to reopen plugin.")
        }

        if (status === "error") {
          this.window?.updateStatusDisplay("Errors while sending. Check logs for details.")
          reject("Send errors")
        }

        Beat.log(`Returning ${responseBodyString}`)
        repliesRemaining--
        if (repliesRemaining > 0) {
          return responseBodyString
        }

        resolve(responseBodyString)
        return responseBodyString
      })

      if (repliesRemaining === 0) {
        resolve("")
        return
      }

      Beat.log(`Waiting for replies:\n${replyMessages.map(({ address }) => ` - ${replyDict.address + address}`).join("\n")}`)
    })
  }

  disconnect() {
    this.window?.close()
  }

  setLineData(range: IRange, key: string, value: string | null) {
    Beat.log(`Set custom data: ${key} = ${value}`)
    const line = Beat.currentParser.lineAtIndex(range.location)
    line.setCustomData(key, value ?? "")
  }

  setRangeColor(range: Beat.Range, backgroundColor: string, foregroundColor?: string) {
    Beat.textBackgroundHighlight(backgroundColor, range.location, range.length)
    if (foregroundColor) {
      Beat.textHighlight(foregroundColor, range.location, range.length)
    }
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

    const testMessage = { address: this.getTargetAddress("/selectedCues"), args: [], hasReply: false }
    const testMessageWithReply = { address: this.getTargetAddress("/selectedCues"), args: [], hasReply: true }
    const beatMenu = Beat.menu(menu.title, menuItems)
    beatMenu.addItem(Beat.separatorMenuItem())
    beatMenu.addItem(Beat.menuItem("Disconnect", ["ctrl", "q"], () => this.disconnect()))
    beatMenu.addItem(Beat.separatorMenuItem())
    beatMenu.addItem(Beat.menuItem("Test Send", ["ctrl", "s"], () => this.send(testMessage, testMessage)))
    beatMenu.addItem(Beat.menuItem("Test Send and Reply", ["ctrl", "r"], async () => this.send(testMessageWithReply, testMessage)))
    Beat.log("Mounted menu items.")
  }

  getCurrentLine() {
    return this.getScriptAppLine(Beat.currentLine)
  }

  getSelectedLines() {
    const linesInRange = Beat.currentParser.linesInRange(Beat.selectedRange())
    return linesInRange
      .filter(line => (line.forSerialization()["string"] as string)?.length)
      .map(line => this.getScriptAppLine(line))
  }

  getLineFromIndex(index: number) {
    return this.getScriptAppLine(Beat.currentParser.lineAtIndex(index))
  }

  private getScriptAppLine(beatLine: Beat.Line): IScriptAppLine {
    const serializedBeatLine = beatLine.forSerialization()
    return {
      string: serializedBeatLine.string as string,
      typeAsString: serializedBeatLine.typeAsString as string,
      range: serializedBeatLine.range as IRange,
      cueId: beatLine.getCustomData("cue_id")
    }
  }

  private getAlertInfo(status: number) {
    switch (status) {
      case OSC.STATUS.IS_NOT_INITIALIZED:
        return {
          title: "Initialization Error",
          message: "Try again. Is \"q-neiform bridge serve\" running?"
        }
      case OSC.STATUS.IS_CONNECTING:
        return {
          title: "Connection Error",
          message: "Try again. Is \"q-neiform bridge serve\" running?"
        }
      default:
        return {
          title: "Unknown Error",
          message: "Closing plugin. Reopen and try again."
        }
    }
  }
}
