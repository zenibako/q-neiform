import { parse } from "yaml";
import { ICue } from "../../types/i-cues";
import ILogger from "../../types/i-logger";
import CurrentWorkingDirectory from "../sources/fs/cwd";
import Cues from "./cues";

export default class LocalCues extends Cues {
  private localCueList: ICue[] = []
  constructor(
    private readonly directory: CurrentWorkingDirectory,
    public readonly logger: ILogger
  ) {
    super(logger)
  }

  async load(name: string) {
    const cueFile = await this.directory.readCueFile(name)
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
