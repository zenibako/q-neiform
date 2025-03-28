import { parse } from "yaml";
import { ICue } from "../../types/i-cues";
import ILogger from "../../types/i-logger";
import Cues from "./cues";
import { IScriptStorage } from "../../types/i-script";

export default class LocalCues extends Cues {
  private localCueList: ICue[] = []
  constructor(
    private readonly storage: IScriptStorage,
    public readonly logger: ILogger
  ) {
    super(logger)
  }

  async load() {
    const cueFile = await this.storage.getYamlCues()
    if (!cueFile) {
      throw new Error("No cue file found.")
    }

    const { cues } = parse(cueFile) as ICue
    if (!cues) {
      throw new Error("No child cues found on root cue.")
    }
    this.localCueList.push(...cues)
  }
}
