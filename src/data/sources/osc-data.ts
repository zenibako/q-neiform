import OscPacket from "../transfer-objects/osc-packet"
import OscBundle from "../transfer-objects/osc-bundle";
import OscUdpPort from "../transfer-objects/osc-udp-port";
import { ICueData } from "../../domain/abstractions/i-cues";

const CONNECT_PHASE = 'connect'

export default class OscData implements ICueData {
    queue: OscBundle[] = []
    mappingByCueNumber: Record<number, string> = {}
    initialized = false
    passcode?: string

    constructor(passcode?: string) {
        this.passcode = passcode
    }

    async initialize(passcode?: string) {
        await this.send(
            new OscBundle(
                CONNECT_PHASE,
                new OscPacket('/connect', passcode || undefined)
            )
        )

        this.initialized = true
    }

    async send(...bundles: OscBundle[]): Promise<string[]> {
        if (!this.initialized) {
            this.initialize()
        }

        return Promise.all(
            bundles.map(async bundle => {
                if (!bundle.packets.length) {
                    throw new Error('No packets set.')
                }

                const oscPort = new OscUdpPort()
                await oscPort.send(bundle)

                return `processed all replies for ${bundle.phase}`
            })
        )
    }
}
