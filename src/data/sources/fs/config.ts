import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import os from "os";
import ILogger from "../../../types/i-logger";
import { ITarget } from "../../../types/i-cues";

const CONFIG_PATH = path.join(os.homedir(), ".config/q-neiform/")
const TARGET_FILE = "target.json"

type TargetContent = {
  defaultTarget?: string
  targets: Record<string, ITarget>
}

export default class Config {
  constructor(
    private readonly logger: ILogger,
  ) {}

  async getTarget(alias?: string): Promise<ITarget> {
    const { defaultTarget, targets } = await this.getTargetContent()
    if (!alias && defaultTarget) {
      alias = defaultTarget
    }

    if (!alias) {
      throw new Error("Alias isn't defined, or no default set")
    }
    return targets[alias] as ITarget
  }

  async setTarget(target: ITarget, alias: string, setDefault: boolean = false): Promise<void> { 
    const targetContent = await this.getTargetContent()
    Object.assign(targetContent.targets, { [alias]: target })
    if (setDefault) {
      targetContent.defaultTarget = alias
    }

    await this.write(JSON.stringify(targetContent, null, 2), TARGET_FILE)
  }

  private async getTargetContent(): Promise<TargetContent> {
    const result = JSON.parse(await this.read(TARGET_FILE) ?? '{}')
    if (!result.targets) {
      result.targets = {}
    }
    return result as TargetContent
  }

  private async read(fileName: string, failOnError?: boolean): Promise<string | null> {
    try {
      const filePath = path.join(CONFIG_PATH, fileName)
      return (await readFile(filePath, { encoding: "utf8" }))
    } catch (e) {
      if (failOnError) {
        throw e
      }
      return null
    }
  }

  private async write(content: string, fileName: string): Promise<void> {
    try {
      await mkdir(CONFIG_PATH, { recursive: true })
      const filePath = path.join(CONFIG_PATH, fileName)
      this.logger.debug(filePath)
      return writeFile(filePath, content, { encoding: "utf8" })
    } catch (e) {
      this.logger.debug(JSON.stringify(e, null, 1))
    }
  }
}
