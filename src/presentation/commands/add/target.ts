import { Args, Command, Flags } from '@oclif/core'
import Config from '../../../data/sources/fs/config'

export default class AddTarget extends Command {
  static override args = {
    alias: Args.string({ description: 'alias of the target' }),
  }
  static override description = 'add a target to your config'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    host: Flags.string({ char: 'h', description: 'host address' }),
    port: Flags.integer({ char: 'p', description: 'host port' }),
    password: Flags.string({ description: 'host password' }),
    setAsDefault: Flags.boolean({ char: 'd', description: 'set as default target' }),
  }

  public async run(): Promise<void> {
    const {
      args: { alias = "default" },
      flags: { host = "localhost", port = 53000, password, setAsDefault = false }
    } = await this.parse(AddTarget)

    const logger = {
      log: (message: string) => this.log(message),
      debug: (message: string) => this.log(message)
    }

    const config = new Config(logger)

    try {
      await config.setTarget({ host, port, password}, alias, setAsDefault)
    } catch (e) {
      this.log("Error: " + JSON.stringify(e, null, 1))
      throw e
    }
  }
}
