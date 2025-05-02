import { Args, Command, Flags } from '@oclif/core'
import { QLabWorkspace } from '../../../data/sources/qlab/workspace'
import OSC from 'osc-js'
import Config from '../../../data/sources/fs/config'
// import Cues from '../../../data/repositories/cues'

export default class AddCues extends Command {
  static override args = {
    file: Args.string({ description: 'file to read' }),
  }
  static override description = 'describe the command here'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    alias: Flags.string({ description: 'alias for target to use' }),
  }

  public async run(): Promise<void> {
    const { flags: { alias } } = await this.parse(AddCues)

    const logger = {
      log: (message: string) => this.log(message),
      debug: (message: string) => this.log(message)
    }

    const { host, port } = await new Config(logger).getTarget(alias)
    if (!host || !port ) {
        throw new Error()
    }

    const plugin = new OSC.DatagramPlugin()
    const osc = new OSC({ plugin })

    const qlab = new QLabWorkspace(osc, host, `${port}`, {
      log: (message) => this.log(message),
      debug: (message) => this.log(message)
    })

    try {
      await qlab.initialize()
      // this.log(response)
      qlab.send()
    } catch (e) {
      this.log("Error: " + JSON.stringify(e, null, 1))
      throw e
    }
  }
}
