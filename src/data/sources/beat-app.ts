import { Menu, MenuItem } from "../../domain/entities/menu"
import { IScriptApp } from "../../domain/abstractions/i-script"
import ILogger from "../../domain/abstractions/i-logger"
import { IOscBridgeApp } from "../../domain/abstractions/i-bridge"
import OSC from "osc-js"

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

  async connectToWebSocket(): Promise<unknown> {
    const modalResponse = Beat.modal({
      title: "Connect to q-neiform OSC bridge.",
      info: "q-neiform uses a Web Socket server to relay OSC messages to the cue server. Please set the values below or leave the defaults, then click OK to connect.",
      items: [
        { type: "text", name: "address", label: "Address", placeholder: `${WS_DEFAULT_ADDRESS}` },
        { type: "text", name: "port", label: "Port", placeholder: `${WS_DEFAULT_PORT}` },
      ]
    })
    if (!modalResponse) {
      Beat.end()
      return
    }

    const { address, port } = modalResponse
    const ui = Beat.assetAsString("ui.html")
    if (address?.length) {
      ui.replace(WS_DEFAULT_ADDRESS, address)
    }
    if (port?.length) {
      ui.replace(WS_DEFAULT_PORT, port)
    }

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
          return { address: `/connect/${passModalResponse.password}` }
        },
        handleReply: (reply: OSC.Message) => {
          Beat.log(`Received reply ${JSON.stringify(reply)}`)
          if (reply.address.startsWith("/reply/connect")) {
            this.window?.runJS(`document.querySelector("#status").textContent = "Connected!"`)
          }
          resolve(reply)
        },
        handleError: (error: object) => {
          Beat.log(`Received error ${JSON.stringify(error)}`)
          this.window?.close()
          reject(error)
        }
      }

      this.window = Beat.htmlWindow(ui, 250, 50, () => {
        Beat.log("Window closed. Ending plugin.")
        Beat.end()
      })
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
