import { IMenuItem, Menu } from "../../domain/entities/menu"
import { IRange, IScriptApp, IScriptAppLine } from "../../domain/abstractions/i-script"
import ILogger from "../../domain/abstractions/i-logger"
import { IOscClient, IOscServer } from "../../domain/abstractions/i-osc"
import OSC from "osc-js"
import { ICue, ICues } from "../../domain/abstractions/i-cues"

export enum Mode { DEVELOPMENT, PRODUCTION }

const WS_DEFAULT_ADDRESS = "localhost"
const WS_DEFAULT_PORT = "8080"

type ServerConfiguration = {
  host: string | null
  port: string | null
  password?: string | null
}

export default class BeatApp implements IScriptApp, IOscClient, ILogger {
  private window?: Beat.Window
  private oscServer?: IOscServer

  constructor(private mode: Mode) {
    if (this.mode == Mode.DEVELOPMENT) {
      Beat.openConsole()
    }


    Beat.onSelectionChange((location, length) => {
      if (!this.oscServer) {
        return
      }

      // Beat.log(Beat.currentLine.characterName())
      Beat.log(`Selection: loc = ${location} / len = ${length}`)
      const cueId = Beat.currentLine.getCustomData("cue_id")
      this.updateStatusDisplay(`Cue ID: ${cueId?.length ? cueId : "None"}"`)
    })

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

  async connect(oscServer: IOscServer): Promise<string> {
    let serverConfig = this.loadServerConfiguration()
    if (!serverConfig?.host || !serverConfig?.port) {
      const { address: modalHost, port: modalPort } = this.promptUserForServerInfo()
      const host = modalHost?.length ? modalHost : WS_DEFAULT_ADDRESS
      const port = modalPort?.length ? modalPort : WS_DEFAULT_PORT
      serverConfig = { host, port }
      this.saveServerConfiguration(serverConfig)
    }

    const ui = Beat.assetAsString("ui.html")
    ui.replace(WS_DEFAULT_ADDRESS, serverConfig.host as string)
    ui.replace(WS_DEFAULT_PORT, serverConfig.port as string)

    const connectAddress = oscServer.dict.connect?.address
    return new Promise((resolve, reject) => {
      Beat.custom = {
        handleOpen: () => {
          let { password } = serverConfig
          if (!password) {
            password = this.promptUserForPassword()
            serverConfig.password = password
          }
          // this.listenforReply()
          return { address: connectAddress, password }
        },
        handleReply: (arg) => {
          const reply = arg as OSC.Message
          Beat.log(`Received connect reply in plugin!`)
          const { address, args } = reply
          if (connectAddress && address.includes(connectAddress)) {
            if (!args?.length) {
              reject("No args returned")
            }
            const [responseBodyString] = args
            const { workspace_id, data } = JSON.parse(responseBodyString as string)
            const splitData = (data as string).split(":")
            if (splitData.length < 2) {
              Beat.alert("Access Error", "Password was incorrect or did not provide permissions. Please try again.")
              serverConfig.password = null
              this.saveServerConfiguration(serverConfig)
              reject("Wrong password")
            }
            this.saveServerConfiguration(serverConfig)
            oscServer.id = workspace_id
            this.updateStatusDisplay(`Connected to QLab server on ${serverConfig.host}:${serverConfig.port}.`)
            this.oscServer = oscServer
          }
          resolve("Received reply")
        },
        handleError: (arg) => {
          const [error, status] = arg as [string, number]
          Beat.log(`Received error: ${error}`)
          const { title, message } = this.getAlertInfo(status)
          Beat.alert(title, message)
          this.saveServerConfiguration({ host: null, port: null })
          this.window?.close()
          reject(title)
        }
      }

      this.window = Beat.htmlWindow(ui, 300, 50, () => {
        Beat.log("Window closed. Disconnecting.")
        this.disconnect()
      })
      this.window.gangWithDocumentWindow()
    })
  }

  isConnected() {
    return !!this.oscServer
  }

  loadServerConfiguration(): ServerConfiguration | null {
    return Beat.getDocumentSetting("server") as ServerConfiguration
  }

  saveServerConfiguration(server: ServerConfiguration | null) {
    Beat.setDocumentSetting("server", server)
  }

  async sendCues(cues: ICues): Promise<ICues> {
    for await (let cue of cues) {
      cue = await this.sendCue(cue)
      cue.clearActions()
    }

    return cues
  }

  sendCue(cue: ICue): Promise<ICue> {
    if (!this.oscServer) {
      throw new Error("No OSC server connected.")
    }
    const { dict } = this.oscServer

    return new Promise((resolve, reject) => {
      Beat.custom.handleReply = (arg) => {
        Beat.log(`Received send reply in plugin!`)
        const [responseBodyString] = (arg as OSC.Message).args
        const { status, address, data } = JSON.parse(responseBodyString as string)

        if (status === "denied") {
          Beat.alert("Access Issue", "Some or all of the messages were denied. Check logs for details.")
          this.updateStatusDisplay("Access denied.")
          reject("Access revoked. Need to reopen plugin.")
        }

        if (status === "error") {
          this.updateStatusDisplay("Errors while sending. Check logs for details.")
          reject("Send errors")
        }

        if (address.endsWith(dict.new.address)) {
          cue.id = data
          Beat.log(`Set ID ${data} on cue: ${cue.name}`)
        }

        resolve(cue)
      }

      const messages = cue.getActions(dict).map(({ address, args }) =>
        `new OSC.Message(${[
          `"${this.oscServer?.getTargetAddress(address) ?? address}"`,
          ...(args.map((arg) => !isNaN(Number(arg.toString())) ? arg : `"${arg}"`))
        ].join(",")})`
      )
      Beat.log(`messages: ${messages}`)
      this.window?.runJS(`sendMessage(new OSC.Bundle([${messages.join(",")}]))`)
      if (cue.id) {
        resolve(cue)
      } else {
        Beat.log(`Waiting for reply so ID can be set...`)
      }
    })
  }

  updateStatusDisplay(text: string) {
    this.window?.runJS(`updateStatusDisplay("${text}")`)
  }

  disconnect() {
    this.window?.runJS(`osc.close()`)
    Beat.end()
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

    const beatMenu = Beat.menu(menu.title, menuItems)
    beatMenu.addItem(Beat.separatorMenuItem())
    beatMenu.addItem(Beat.menuItem("Disconnect", ["cmd", "q"], () => this.disconnect()))
    Beat.log("Mounted.")
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
