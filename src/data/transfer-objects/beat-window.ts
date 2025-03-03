import { IOscMessage } from "../../domain/abstractions/i-osc"

const WIDTH = 300
const HEIGHT = 50

export default class BeatWebSocketWindow {
  private window: Beat.Window

  constructor(host: string, port: string) {
    this.window = Beat.htmlWindow(`
<span id="status"></span>
<script type="text/javascript" src="lib/osc.min.js"></script>
<script type="text/javascript">
  function updateStatusDisplay(message) {
    Beat.log("Updating status display: " + message)
    document.querySelector("#status").textContent = message
  }

  const osc = new OSC({
    plugin: new OSC.WebsocketClientPlugin({ host: "${host}", port: ${port} })
  })

  function sendMessage(message, replyAddress = "*") {
    const replyListener = osc.on(replyAddress, (reply) => {
      osc.off(replyAddress, replyListener)
      Beat.call((arg) => Beat.custom.handleReply(arg), reply)
    })
    osc.send(message)
  }

  function throwError(error) {
    Beat.call((error, status) => Beat.custom.handleError(error, status), [error, osc.status()])
  }

  updateStatusDisplay("Connecting to bridge at ${host}:${port}...")
  osc.on("error", (error) => throwError(error))
  osc.on("open", () => Beat.callAndWait("Beat.custom.handleOpen()").then(
      ({address, password}) => sendMessage(new OSC.Message(address, password)),
      (error) => throwError(error)
    )
  )
  osc.open()
</script>`, WIDTH, HEIGHT, this.close
    )
    this.window.gangWithDocumentWindow()
  }

  send(...messages: IOscMessage[]): void {
    const messageStrings = messages.map(({ address, args }) =>
      `new OSC.Message(${[address, ...args]
        .map((arg) => !isNaN(Number(arg.toString())) ? arg : `"${arg}"`)
        .join(",")}
      )`
    )

    let jsString = "sendMessage"
    if (messageStrings.length === 1) {
      const [messageString] = messageStrings
      jsString += `(${messageString})`
    } else {
      jsString += `(new OSC.Bundle([${messageStrings.join(",")}]))`
    }

    Beat.log(jsString)
    this.window.runJS(jsString)
  }

  updateStatusDisplay(text: string) {
    this.window.runJS(`updateStatusDisplay("${text}")`)
  }

  close() {
    this.window.runJS(`osc.close()`)
    this.window.close()
    Beat.end()
  }
}
