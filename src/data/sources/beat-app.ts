import { IMenuItem, Menu, MenuItem } from "../../domain/entities/menu"
import { IScriptApp } from "../../domain/abstractions/i-script"
import ILogger from "../../domain/abstractions/i-logger"
import { IOscClient, IOscServer } from "../../domain/abstractions/i-osc"
import OSC from "osc-js"
import { Cue } from "../../domain/entities/cue"

export enum Mode { DEVELOPMENT, PRODUCTION }

const WS_DEFAULT_ADDRESS = "localhost"
const WS_DEFAULT_PORT = "8080"

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
      Beat.log(`Loc: ${location} / Len: ${length}`)
      const cueId = Beat.currentLine.getCustomData("cue_id")
    })
  }

  log(message: string) {
    Beat.log(message)
  }

  async connect(oscServer: IOscServer): Promise<string> {
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

    const { address, port } = modalResponse
    const ui = Beat.assetAsString("ui.html")
    if (address?.length) {
      ui.replace(WS_DEFAULT_ADDRESS, address)
    }
    if (port?.length) {
      ui.replace(WS_DEFAULT_PORT, port)
    }

    const connectAddress = oscServer.dict.connect?.address
    return new Promise((resolve, reject) => {
      Beat.custom = {
        handleOpen: () => {
          const passModalResponse = Beat.modal({
            title: "Connect to q-neiform OSC bridge.",
            info: `Enter the password in your cue server.`,
            items: [
              { type: "text", name: "password", label: "Password" }
            ]
          })
          if (!passModalResponse?.password?.length) {
            reject("Password not provided")
            return
          }
          return { address: `${connectAddress}/${passModalResponse.password}` }
        },
        handleReply: (arg) => {
          const reply = arg as OSC.Message
          Beat.log(`Received reply ${reply}`)
          if (connectAddress && reply.address.includes(connectAddress)) {
            this.window?.runJS(`document.querySelector("#status").textContent = "Connected!"`)
            this.oscServer = oscServer
          }
          resolve("Received reply")
        },
        handleError: (arg) => {
          const [error, status] = arg as [string, number]
          Beat.log(`Received error: ${error}`)
          const { title, message } = this.getAlertInfo(status)
          Beat.alert(title, message)
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

  send(cue: Cue): Promise<Cue> {
    return new Promise((resolve, reject) => {
      if (!this.oscServer) {
        reject("No OSC server connected.")
      }

      Beat.custom.handleReply = (arg) => {
        const reply = arg as OSC.Bundle
        Beat.log(`Received reply: ${JSON.stringify(reply.bundleElements)}`)
        cue.actionQueue = []
        resolve(cue)
      }

      const messages = cue.actionQueue.map(action => `new OSC.Message("${[action.address, ...action.args].join(`","`)}")`)
      const sendJS = `osc.send(new OSC.Bundle([${messages.join(",")}])`
      Beat.log(sendJS)
      this.window?.runJS(sendJS)
    })
  }

  disconnect() {
    this.window?.runJS(`osc.close()`)
    Beat.end()
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
    return Beat.currentLine
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
