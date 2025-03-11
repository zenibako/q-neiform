import OSC from "osc-js"
import { IOscMessage } from "../../domain/abstractions/i-osc"

const WIDTH = 300
const HEIGHT = 50

export default class BeatWebSocketWindow {
  private window: Beat.Window

  constructor(host: string, port: string, callback: (osc: unknown) => void) {
    Beat.custom.handleOpen = callback
    this.window = Beat.htmlWindow(`
<span id="status"></span>
<script type="text/javascript" src="lib/osc.min.js"></script>
<script type="text/javascript">
  function updateStatusDisplay(message) {
    Beat.log(message)
    document.querySelector("#status").textContent = message
  }

  const osc = new OSC({
    plugin: new OSC.WebsocketClientPlugin({ host: "${host}", port: ${port} })
  })

  function sendMessage(message, replyAddress = "*") {
    const replyListener = osc.on(replyAddress, (reply) => {
      // osc.off(replyAddress, replyListener)
      Beat.log("Reply received in window.")
      Beat.callAndWait((arg) => Beat.custom.handleReply(arg), reply).then(
        (response) => Beat.log("Reply processed in plugin: " + response)
      )
    })
    osc.send(message)
    Beat.log("Message sent.")
  }

  function throwError(error) {
    Beat.call((error, status) => Beat.custom.handleError(error, status), [error, osc.status()])
  }

  updateStatusDisplay("Connecting to bridge at ${host}:${port}...")
  osc.on("error", (error) => throwError(error))
  osc.on("open", () => Beat.call((arg) => Beat.custom.handleOpen(arg), osc))
  osc.open()
</script>`, WIDTH, HEIGHT, this.close
    )
    this.window.gangWithDocumentWindow()
  }

  send(messages: IOscMessage[], callback: (message: unknown) => string): void {
    if (callback) {
      Beat.custom.handleReply = callback
    }

    Beat.custom.handleError = (arg) => {
      const [error, status] = arg as [string, number]
      const { title, message } = this.getAlertInfo(status)
      Beat.alert(title, message)
      throw new Error(error)
    }

    const messageStrings = messages.map(({ address, args }) => {
      const messageArgs = [address, ...args].map((arg) => !isNaN(Number(arg.toString())) ? arg : `"${arg}"`)
      return `new OSC.Message(${messageArgs.join(",")})`
    })

    let jsString = "sendMessage"
    if (messageStrings.length === 1) {
      const [messageString] = messageStrings
      jsString += `(${messageString})`
    } else {
      jsString += `(new OSC.Bundle([${messageStrings.join(",")}]))`
    }

    Beat.log(`Executing in window: ${jsString}`)
    this.window.runJS(jsString)
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

  updateStatusDisplay(text: string) {
    this.window.runJS(`updateStatusDisplay("${text}")`)
  }

  close() {
    this.window?.close()
    Beat.end()
  }
}

