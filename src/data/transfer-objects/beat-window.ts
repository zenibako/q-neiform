import OSC from "osc-js"
import { IOscMessage } from "../../domain/abstractions/i-osc"

const WIDTH = 300
const HEIGHT = 50

export default class BeatWebSocketWindow {
  private window: Beat.Window

  constructor(host: string, port: string, callback: (osc: unknown) => void) {
    Beat.custom.handleOpen = callback
    Beat.custom.handleError = (arg) => {
      const [error, status] = arg as [string, number]
      Beat.log(`Received error: ${JSON.stringify(error, null, 1)}`)
      const { title, message } = this.getAlertInfo(status)
      Beat.alert(title, message)
      throw new Error(error)
    }

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
    const replyListener = osc.on(replyAddress, ({ address, args }) => {
      // osc.off(replyAddress, replyListener)
      Beat.log("Reply received in window: " + JSON.stringify({ address, args }, null, 1))
      Beat.call((replyMessage) => Beat.custom.handleReply(replyMessage), { address, args })
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
</script>`, WIDTH, HEIGHT, () => {
        Beat.log("Closed window.")
      }
    )

    this.window.gangWithDocumentWindow()
  }

  send(messages: IOscMessage[], callback: (message: unknown) => void): void {
    if (callback) {
      Beat.custom.handleReply = callback
    }
    
    let onAddress = "*"
    const messageStrings = messages.map(({ address, args, listenOn }) => {
      const messageArgs = [address, ...args].map((arg) => !isNaN(Number(arg.toString())) ? arg : `"${arg}"`)
      if (listenOn) {
        onAddress = listenOn
      }
      return `new OSC.Message(${messageArgs.join(",")})`
    })

    const jsString = `sendMessage(new OSC.Bundle([${messageStrings.join(",")}]), "${onAddress}")`
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
    Beat.log("Closing window and connection...")
    this.window.runJS(`osc.close()`)
    this.window.close()
  }
}

