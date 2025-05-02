import { Command, Flags } from '@oclif/core'
import { QLabWorkspace } from '../../../data/sources/qlab/workspace'
import OSC from 'osc-js'
import Config from '../../../data/sources/fs/config'

const DEFAULT_HOST: string = "localhost"
const DEFAULT_PORT: number = 53000

export default class StartBridge extends Command {
  static override description = 'describe the command here'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    alias: Flags.string({ char: 'a', description: 'alias for target' }),
  }

  public async run(): Promise<void> {
    const { flags: { alias } } = await this.parse(StartBridge)

    const logger = {
      log: (message: string) => this.log(message),
      debug: (message: string) => this.log(message)
    }

    const { host = DEFAULT_HOST, port = DEFAULT_PORT } = await new Config(logger).getTarget(alias)
    const osc = new OSC({
      plugin: new OSC.BridgePlugin({
        udpClient: { port, host },      // Target QLab's port
        udpServer: { port: port + 1 },  // This bridge's port
        receiver: "udp"
      })
    })
    const qlab = new QLabWorkspace(osc, host, `${port}`, logger)

    try {
      await qlab.initialize()
      // this.log(response)
      qlab.listen()
    } catch (e) {
      this.log("Error: " + JSON.stringify(e, null, 1))
      throw e
    }
  }
}
