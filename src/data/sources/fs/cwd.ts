import { readFile } from "fs/promises";
import path from "path";
import ILogger from "../../../types/i-logger";
import { IScriptStorage } from "../../../types/i-script";

export default class CurrentWorkingDirectory implements IScriptStorage {
  private readonly absolutePath: string
  constructor(
    private readonly logger: ILogger,
    private readonly name: string,
    private readonly relativePath: string = ""
  ) {
    this.absolutePath = path.join(process.cwd(), this.relativePath)
  }

  async getFountainText(): Promise<string | null> {
    return this.readFile(this.name, "fountain")
  }

  async getYamlCues(): Promise<string | null> {
    return this.readFile(this.name, "q.yml") ?? this.readFile(this.name, "q.yaml")
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
