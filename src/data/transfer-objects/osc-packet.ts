// import { CueCommand } from "../../domain/abstractions/i-cues"
import OscArg from "./osc-arg"

//export default class OscPacket implements CueCommand {
export default class OscPacket {
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
