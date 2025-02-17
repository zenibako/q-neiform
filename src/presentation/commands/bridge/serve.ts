import { Args, Command, Flags } from '@oclif/core'
import QLabApp from '../../../data/sources/qlab-app'
import Cues from '../../../data/repositories/cues'
import BridgeApps from '../../../domain/use-cases/bridge-apps'

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
    const qlab = new QLabApp(this, flags.host, flags.port)
    const cues = new Cues(qlab, this)

    await new BridgeApps(cues).execute()

    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}
