import OSC from "osc-js"
import { IOscClient, IOscDictionary, IOscMessage, IOscServer } from "../../../types/i-osc"
import { BeatWindow } from "../../../types/beat/beat-types"
import { QLabWorkspace } from "../qlab/workspace"
import ILogger from "../../../types/i-logger"

const WIDTH = 300
const HEIGHT = 50

export default class BeatWebSocketWindow implements IOscClient, ILogger {
  private readonly html: string

  private _window?: BeatWindow
  private get window() {
    if (!this._window) {
      throw new Error("No window has been set. Client must be initialized first.")
    }
    return this._window
  }

  private _server?: IOscServer
  private get server() {
    if (!this._server) {
      throw new Error("No server has been set. Client must be initialized first.")
    }
    return this._server
  }

  constructor(
    private readonly host: string,
    private readonly port: string
  ) {
    this.html = `
<span id="status"></span>
<script type="text/javascript" src="lib/osc.min.js"></script>
<script type="text/javascript">
  function updateStatusDisplay(message) {
    // Beat.log(message)
    document.querySelector("#status").textContent = message
  }

  const osc = new OSC({
    plugin: new OSC.WebsocketClientPlugin({ host: "${host}", port: ${port} })
  })

  function sendMessage(message, replyAddress = "*") {
    const replyListener = osc.on(replyAddress, ({ address, args }) => {
      osc.off(replyAddress, replyListener)
      const reply = { address, args }
      // Beat.log("Received send reply in window: " + JSON.stringify(reply, null, 1))
      Beat.call((arg) => Beat.custom.handleReply(JSON.stringify(arg)), reply)
    })
    osc.send(message)
    // Beat.log("Message sent.")
  }

  function throwError(error) {
    Beat.call((error, status) => Beat.custom.handleError(error, status), [error, osc.status()])
  }

  updateStatusDisplay("Connecting to bridge at ${host}:${port}...")
  osc.on("error", (error) => throwError(error))
  osc.on("open", () => Beat.call((arg) => Beat.custom.handleOpen(arg), osc))
  osc.open()
</script>`
  }

  async initialize(password?: string): Promise<BeatWebSocketWindow> {
    return new Promise((resolve, reject) => {
      Beat.custom.handleOpen = async (osc: unknown) => {
        this._server = new QLabWorkspace(osc as OSC, this.host, this.port, this)
        if (!password) {
          throw new Error("Need a password!")
        }
        await this.connectToBridge(password)
        resolve(this)
      }

      Beat.custom.handleError = ([error, status]: [string, number]) => {
        const { title, message } = this.getAlertInfo(status, error)
        Beat.alert(title, message)
        reject({ error, status })
      }

      this._window = Beat.htmlWindow(this.html, WIDTH, HEIGHT, () => {
        Beat.log("Closed window.")
      })
      this.window.gangWithDocumentWindow()
    })
  }

  log(message: string) {
    Beat.log(message)
  }

  debug(message: string) {
    Beat.log(`[DEBUG]: ${message}`)
  }

  async send(...messages: IOscMessage[]): Promise<IOscMessage[]> {
    const messagesExpectingReplies = messages.filter(({ listenOn }) => !!listenOn)
    return new Promise((resolve, reject) => {
      const replyMessages: IOscMessage[] = []
      Beat.custom.handleReply = (arg: unknown) => {
        const replyMessage = JSON.parse(arg as string) as IOscMessage
        replyMessages.push(replyMessage)
        // Beat.log(`Received send reply in plugin: ${JSON.stringify(replyMessage, null, 1)}`)

        if (messagesExpectingReplies.length === replyMessages.length) {
          resolve(replyMessages)
        }
      }

      let onAddress = "*"
      const messageStrings = messages.map(({ address, args, listenOn }) => {
        const messageArgs = [address, ...args].map((arg) => !isNaN(Number(arg.toString())) ? arg : `"${arg}"`)
        if (listenOn) {
          onAddress = listenOn
        }
        return `new OSC.Message(${messageArgs.join(",")})`
      })
      Beat.custom.handleError = ([error, status]: [string, number]) => {
        Beat.debug(`Received error: ${JSON.stringify(error, null, 1)}`)
        reject({ error, status })
      }

      this.debug(JSON.stringify({ messagesExpectingReplies, messageStrings, onAddress }, null, 1))
      this.window.runJS(`sendMessage(new OSC.Bundle([${messageStrings.join(",")}]), "${onAddress}")`)
      if (!messagesExpectingReplies.length) {
        resolve([])
      }

      Beat.log(`Waiting for replies:\n${messagesExpectingReplies.map(({ listenOn: replyAddress }) => ` - ${replyAddress}`).join("\n")}`)
    })
    
    /*
    return this.processMessages(messages)
    for (const reply of replies) {
      const { args } = reply
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
        this.updateStatusDisplay("Access denied.")
        reject("Access revoked. Need to reopen plugin.")
      }

      if (status === "error") {
        this.updateStatusDisplay("Errors while sending. Check logs for details.")
        reject("Send errors")
      }

      replyStrings.push(responseBody)
      repliesRemaining--
      if (repliesRemaining === 0) {
        return resolve(replyStrings)
      }
      */
    }

  private async connectToBridge(password: string): Promise<string> {
    const { reply: { address: replyAddress }, connect } = this.getDictionary()

    try {
      const [connectResponse] = await this.send({
        address: connect.address,
        args: [password!],
        listenOn: replyAddress + connect.address,
      })
      if (!connectResponse) {
        throw new Error("No connect response")
      }
      this.server.setIdFromConnectResponse(connectResponse)
      this.updateStatusDisplay("Connected!")
      return "Successfully connected."
    } catch (e) {
      this.close()
      throw e
    }
  }

  updateStatusDisplay(text: string) {
    this.window.runJS(`updateStatusDisplay("${text}")`)
  }

  getDictionary(): IOscDictionary {
    const dict = this.server.getDictionary()
    if (!dict) {
      throw new Error("No dictionary found.")
    }

    return dict
  }

  getTargetAddress(address: string): string {
    return this.server.getTargetAddress(address)
  }

  close() {
    this.window.runJS(`osc.close()`)
    this.window.close()
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

