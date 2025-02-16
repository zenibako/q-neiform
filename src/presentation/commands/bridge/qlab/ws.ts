import {Args, Command, Flags} from '@oclif/core'
import QLabApp from '../../../../data/sources/qlab-app'
import OSC from 'osc-js'
import Cues from '../../../../data/repositories/cues'
import BridgeApps from '../../../../domain/use-cases/bridge-apps'
import OscPort from '../../../../data/transfer-objects/osc-port'

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
    password: Flags.string({char: 'p', description: 'password for QLab'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(BridgeQlabWs)

    const name = flags.name ?? 'world'
    this.log(`hello ${name} from /Users/chandleranderson/Projects/q-neiform/src/commands/bridge/qlab/ws.ts`)
    const qlab = new QLabApp(this, flags.host, flags.port)
    const { host, port } = qlab

    const osc = new OSC({
      plugin: new OSC.BridgePlugin({
        udpClient: { port: port + 1 },
        udpServer: { port, host }
      })
    })
    
    const cues = new Cues(qlab, this)
    
    await new BridgeApps(cues).execute(new OscPort(osc, this), flags.password)
    
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}
