import { ICues } from "../../types/i-cues";
import ILogger from "../../types/i-logger";
import { IOscClient } from "../../types/i-osc";
import Cues from "./cues";

export default class RemoteCues extends Cues {
  constructor(
    private readonly oscClient: IOscClient,
    public readonly logger: ILogger,
  ) {
    super(logger)
  }

  async send(cues?: ICues): Promise<void> {
    for (const cue of this.merge(cues)) {
      const messages = cue.getActions(this.oscClient)
      const [replyMessage] = await this.oscClient.send(...messages)
      if (!replyMessage) {
        continue
      }
      const [ replyArg ] = replyMessage.args
      if (!replyArg) {
        continue
      }
      const { data } = JSON.parse(replyArg as string)
      cue.id = data
      this.logger.debug(`Set ID on cue: ${cue.id}`)
    }
    this.logger.debug("Push done!")
  }
}
