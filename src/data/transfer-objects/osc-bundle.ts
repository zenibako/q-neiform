import { ICue, ICueCommandBundle } from "../../domain/abstractions/i-cues"
import OscPacket from "./../transfer-objects/osc-packet"

export default class OscBundle implements ICueCommandBundle {
    packets: OscPacket[] = []
    phase: string
    mappingByCueNumber: Record<number, string> = {}

    constructor(phase: string, ...packets: OscPacket[]) {
        this.phase = phase
        this.packets = packets
        this.addPackets(
            new OscPacket('/cueLists')
        )
    };

    addPackets(...packets: OscPacket[]) {
        this.packets.concat(...packets)
        return this
    }


    addPacketsWithArgsOnly(...packets: OscPacket[]) {
        const packetsWithArgs = packets.filter(({ args }) => args.length)
        return this.addPackets(...packetsWithArgs)
    }

    addFromCue(cue: ICue) {
        const { isNewCue, type, cueAddress, number, name, mode, fileTarget, color } = cue
        if (isNewCue) {
            this.addPackets(
                new OscPacket('/new', type)
            )
        }

        this.addPacketsWithArgsOnly(
            new OscPacket(`${cueAddress}/number`, number),
            new OscPacket(`${cueAddress}/name`, name),
            new OscPacket(`${cueAddress}/mode`, mode),
            new OscPacket(`${cueAddress}/colorName`, color)
        )
    
        if (type === 'audio' && fileTarget) {
            this.addPackets(new OscPacket(`${cueAddress}/fileTarget`, fileTarget))
        }

        if (this.phase === 'moves') {
            const { id, parentId, childIndex } = cue;
            if (id && parentId && childIndex) {
                this.addPackets(
                    new OscPacket(`/move/${id}`, childIndex, parentId)
                )
            }
        }
        
        return this
    }
}
