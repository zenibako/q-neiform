import { IMenuItem, Menu } from "../../domain/entities/menu"
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
      Beat.log(`Selection: loc = ${location} / len = ${length}`)
      const cueId = Beat.currentLine.getCustomData("cue_id")
      this.updateStatusDisplay(`Cue ID: ${cueId?.length ? cueId : "None"}"`)
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
          if (!passModalResponse) {
            reject("Password not provided")
            return
          }
          return { address: connectAddress, password: passModalResponse.password }
        },
        handleReply: (arg) => {
          const reply = arg as OSC.Message
          Beat.log(`Received reply: ${reply}`)
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
              reject("Wrong password")
            }
            oscServer.id = workspace_id
            this.updateStatusDisplay("Connected!")
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

      const messages = cue.actionQueue.map(({ address, args }) =>
        `new OSC.Message(${[
          `"${this.oscServer?.getTargetAddress(address) ?? address}"`,
          ...(args.map((arg) => !isNaN(Number(arg.toString())) ? arg : `"${arg}"`))
        ].join(",")})`
      )

      const expectedReplyCount = cue.actionQueue.filter(({ address }) => {
        const dictKey = address.substring(address.lastIndexOf("/") + 1)
        Beat.log(`dictKey: ${dictKey}`)
        return this.oscServer?.dict[dictKey]?.replyDataExample
      })
        .length

      const replyStatuses: string[] = []
      Beat.custom.handleReply = (arg) => {
        const reply = arg as OSC.Message
        const [responseBodyString] = reply.args
        const { status, address, data } = JSON.parse(responseBodyString as string)
        replyStatuses.push(status)
        Beat.log(`Received reply: address = ${address}, status = ${status}, data = ${data}`)

        if (status === "ok" && address.endsWith(this.oscServer?.dict.new.address)) {
          Beat.log(`Setting cue ID: ${data}`)
          cue.id = data
        }

        if (expectedReplyCount > 0 && replyStatuses.length < expectedReplyCount) {
          Beat.log(`Still waiting for ${expectedReplyCount - 1} replies...`)
          return
        }

        cue.actionQueue = []
        if (replyStatuses.includes("denied")) {
          Beat.alert("Access Issue", "Some or all of the messages were denied. Check logs for details.")
          reject("Access revoked. Need to reopen plugin.")
        }
        if (replyStatuses.includes("error")) {
          Beat.alert("Send Error", "Some or all of the messages had errors. Check logs for details.")
        }

        this.updateStatusDisplay("All messages sent!")
        resolve(cue)
      }

      const sendJS = `osc.send(new OSC.Bundle([${messages.join(",")}]))`
      Beat.log(sendJS)
      this.updateStatusDisplay(`Sending ${messages.length} messages...`)
      this.window?.runJS(sendJS)

      const timeoutDelay = 5000
      this.updateStatusDisplay(`Waiting ${timeoutDelay / 1000} seconds for replies.`)
      setTimeout(() => {
        if (replyStatuses.length) {
          return
        }
        this.updateStatusDisplay("All messages sent!")
        resolve(cue)
      }, timeoutDelay)
    })
  }

  updateStatusDisplay(text: string) {
    this.window?.runJS(`document.querySelector("#status").textContent = "${text}"`)
  }

  disconnect() {
    this.window?.runJS(`osc.close()`)
    Beat.end()
  }

  setLineData(line: Beat.Line, key: string, value: string = "") {
    Beat.log(`Set custom data: ${key} = ${value}`)
    line.setCustomData(key, value)
    return line
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
    const line = Beat.currentLine
    Beat.log(`${JSON.stringify(line.forSerialization())}`)
    return line
  }

  getSelectedLines(): Beat.Line[] {
    return Beat.currentParser.linesInRange(Beat.selectedRange())
  }

  getLineFromIndex(index: number): Beat.Line {
    Beat.log(`get line at index ${index}`)
    const line = Beat.currentParser.lineAtIndex(index)
    Beat.log(`line: ${JSON.stringify(line.forSerialization())}`)
    return line
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
