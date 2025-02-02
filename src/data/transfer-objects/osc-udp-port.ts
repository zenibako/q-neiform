import osc from "osc"
import OscBundle from "./osc-bundle"
import { getMapping } from "../../common/qlab-helper"; // TODO: Make less specific to QLab
import OscPacket from "./osc-packet";

export default class OscUdpPort {
    target: object
    isProcessing = false
    newCueIds: string[] = []
    replyCount = 0

    constructor(port = 53000) {        
        console.log(`setting osc port to ${port}`)

        this.target = new osc.UDPPort({
            localPort: port + 1,
            remoteAddress: "localhost",
            remotePort: port,
            metadata: true
        })

        this.target.on("error", function (error: string) {
            throw new Error(error);
        })
    }

    async send(bundle: OscBundle): Promise<object> {
        this.target.on('message', (oscMsg: OscPacket) => {
            const { address } = oscMsg;
            this.replyCount++
            console.log(`reply ${this.replyCount} at address ${address}`)

            try {
                oscMsg.process().forEach(data => {
                    if (address === '/reply/new') {
                        this.newCueIds.push(data as unknown as string)
                    } else if (address === '/reply/cueLists') {
                        // console.log(`new mapping for phase ${this.phase}`, mappingByCueNumber);
                        console.log(`closing osc port`)
                        this.target.close()
                        return getMapping(data)
                        // this.isProcessing = false
                    }
                })
            } catch (error) {
                const lastPacket = bundle.packets[this.replyCount - 1]
                throw new Error(`${error} + ': ${JSON.stringify(lastPacket, undefined, 2)}`)
            }
        })

        console.log(`opening osc port`)

        const timeoutSeconds = 60000
        setTimeout(() => {}, timeoutSeconds)

        throw new Error(`Timed out after ${timeoutSeconds/1000}`)
    }
}
