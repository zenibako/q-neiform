import LocalCues from "../../data/repositories/local-cues";
import RemoteCues from "../../data/repositories/remote-cues";
import ILogger from "../../types/i-logger";
import { IUseCase } from "../../types/i-use-cases";

export default class PushCuesFromScript implements IUseCase {
  constructor(private localCues: LocalCues, private remoteCues: RemoteCues, private logger: ILogger) { }

  async execute() {
    this.logger.debug("Pushing cues...")
    try {
      this.remoteCues.send(this.localCues)
    } catch (e) {
      this.logger.debug(`Error while pushing: ${(e as Error).message ?? e}`)
    }
    return this
  }
}
