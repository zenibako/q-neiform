import OscPacket from "./osc-packet"

export default class OscBundle {
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

/*
addFromCue(cue: ICue) {
    const { id, type, address, number, name, mode, color } = cue
    if (!id) {
        this.addPackets(
            new OscPacket('/new', type)
        )
    }

    this.addPacketsWithArgsOnly(
        new OscPacket(`${address}/number`, number),
        new OscPacket(`${address}/name`, name),
        new OscPacket(`${address}/mode`, mode),
        new OscPacket(`${address}/colorName`, color)
    )
 
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
    */
}
