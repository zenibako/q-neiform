import { Menu, MenuItem } from "../../domain/entities/menu"
import { IScriptApp } from "../../domain/abstractions/i-script"
import ILogger from "../../domain/abstractions/i-logger"
import { IOscBridgeApp } from "../../domain/abstractions/i-bridge"

export enum Mode { DEVELOPMENT, PRODUCTION }

const WS_DEFAULT_ADDRESS = "localhost"
const WS_DEFAULT_PORT = "8080"

export default class BeatApp implements IScriptApp, IOscBridgeApp, ILogger {
  private window?: Beat.Window

  constructor(private mode: Mode) {
    if (this.mode == Mode.DEVELOPMENT) {
      Beat.openConsole()
    }
  }

  log(message: string) {
    Beat.log(message)
  }

  async connectToWebSocket(): Promise<object> {
    return new Promise((resolve, reject) => {
      const { password = "", address, port } = Beat.modal({
        title: "Connect to q-neiform OSC bridge.",
        info: "q-neiform uses a Web Socket server to relay OSC messages to the cue server. Please set the values below or leave the defaults, then click OK to connect.",
        items: [
          { type: "text", name: "password", label: "Host Password", placeholder: `Enter the password in your cue server.` },
          { type: "text", name: "address", label: "Host Address", placeholder: `${WS_DEFAULT_ADDRESS}` },
          { type: "text", name: "port", label: "Host Port", placeholder: `${WS_DEFAULT_PORT}` },
        ]
      })

      Beat.custom = {
        handleReply: (reply: object) => {
          Beat.log("success")
          resolve(reply)
        },
        handleError: (error: object) => {
          Beat.log("error")
          reject(error)
        }
      }

      const ui = Beat.assetAsString("ui.html")
      this.window = Beat.htmlWindow(ui, 100, 100, () => Beat.end())
      this.window.runJS(`open("${address ?? WS_DEFAULT_ADDRESS}", ${port})`)
      this.window.runJS(`send("${'/connect/' + password}")`)
    })
  }

  pullOutline() {
    return Beat.outline()
  }

  mountMenu(menu: Menu) {
    Beat.menu(menu.title, menu.getMenuItems().map((item) => {
      if (item?.title) {
        return Beat.separatorMenuItem()
      }

      const { title, keyboardShortcuts, click } = item as MenuItem
      return Beat.menuItem(title, keyboardShortcuts ?? [], click)
    }))
  }
}
