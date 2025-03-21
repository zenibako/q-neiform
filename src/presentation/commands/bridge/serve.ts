import { Args, Command, Flags } from '@oclif/core'
import { QLabWorkspace } from '../../../data/sources/qlab-workspace'
import OSC from 'osc-js'
// import Cues from '../../../data/repositories/cues'

export default class BridgeServe extends Command {
  static override args = {
    file: Args.string({ description: 'file to read' }),
  }
  static override description = 'describe the command here'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({ char: 'f' }),
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({ char: 'n', description: 'name to print' }),
    host: Flags.string({ char: 'h', description: 'host address for QLab' }),
    port: Flags.integer({ char: 'p', description: 'host port for QLab' }),
    password: Flags.string({ description: 'host password for QLab' }),
  }

  public async run(): Promise<void> {
    const { flags: { host = "localhost", port = 53000 } } = await this.parse(BridgeServe)
    const osc = new OSC({
      plugin: new OSC.BridgePlugin({
        udpClient: { port, host },      // Target QLab's port
        udpServer: { port: port + 1 },  // This bridge's port
        receiver: "udp"
      })
    })

    const qlab = new QLabWorkspace(osc, host, `${port}`, {
      log: (message) => this.log(message),
      debug: (message) => this.log(message)
    })

    try {
      const response = await qlab.initialize()
      this.log(response)
      qlab.listen()
    } catch (e) {
      this.log("Error: " + JSON.stringify(e, null, 1))
      throw e
    }
  }
}
