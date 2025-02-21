import { Args, Command, Flags } from '@oclif/core'
import QLabApp from '../../../data/sources/qlab-app'
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
    const { args, flags } = await this.parse(BridgeServe)
    const qlab = new QLabApp(this)
    // const cues = new Cues(this, qlab, this)

    try {
      const connectionMessage = await qlab.bridge(flags.host, flags.port)
      this.log(connectionMessage)
    } catch (e) {
      this.log("Error: " + ((e as Error).message ?? e))
      throw e
    }

    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}
