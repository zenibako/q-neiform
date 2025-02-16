import {Args, Command, Flags} from '@oclif/core'
import QLabApp from '../../../../data/sources/qlab-app'
import Cues from '../../../../data/repositories/cues'
import BridgeApps from '../../../../domain/use-cases/bridge-apps'

export default class BridgeQlabWs extends Command {
  static override args = {
    file: Args.string({description: 'file to read'}),
  }
  static override description = 'describe the command here'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({char: 'f'}),
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({char: 'n', description: 'name to print'}),
    host: Flags.string({description: 'host address for QLab'}),
    port: Flags.integer({description: 'host port for QLab'}),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(BridgeQlabWs)
    const qlab = new QLabApp(this, flags.host, flags.port)
    const cues = new Cues(qlab, this)
    
    await new BridgeApps(cues).execute(flags.password)
    
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}
