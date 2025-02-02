import { CueCommand } from "../../domain/abstractions/ICueCommand"
import OscArg from "./OscArg"

export default class OscPacket implements CueCommand {
    address: string
    args: OscArg[]

    constructor(address: string, ...args: unknown[]) {
        this.address = address
        this.args = args.map(v => new OscArg(v))
    }

    process(): object[] {
        return this.args.map((arg: OscArg) => arg.parse())
    }
}
