import { readFile } from "fs/promises";
import path from "path";
import ILogger from "../../../types/i-logger";
import { IScriptEditor } from "../../../types/i-script";

export default class CurrentWorkingDirectory implements IScriptEditor {
  public readonly absolutePath: string
  constructor(private readonly logger: ILogger, private readonly relativePath: string = "") {
    this.absolutePath = path.join(process.cwd(), this.relativePath)
  }

  async readFountainFile(name: string): Promise<string | null> {
    return this.readFile(name, "fountain")
  }

  async readCueFile(name: string): Promise<string | null> {
    return this.readFile(name, "q.yml") ?? this.readFile(name, "q.yaml")
  }

  private async readFile(name: string, ext: string): Promise<string | null> {
    try {
      const filePath = path.join(this.absolutePath, name + "." + ext)
      this.logger.debug(filePath)
      return readFile(filePath, { encoding: "utf8" })
    } catch (e) {
      this.logger.debug(JSON.stringify(e, null, 1))
      return null
    }
  }
}
