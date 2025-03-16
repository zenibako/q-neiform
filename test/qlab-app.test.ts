import { mock } from 'jest-mock-extended'
import { IOscMessage } from '../src/domain/abstractions/i-osc'
import OSC from 'osc-js'
import { OSC_DICTIONARY, QLabWorkspace } from '../src/data/sources/qlab-app'
import ILogger from '../src/domain/abstractions/i-logger'

const replyConnectAddress = OSC_DICTIONARY.reply.address + OSC_DICTIONARY.connect.address
const replyConnectData = {
  workspace_id: "12345",
  data: "ok:view|edit|control"
}

const replyNewAddress = OSC_DICTIONARY.reply.address + OSC_DICTIONARY.new.address
const replyNewData = {
  status: "ok",
  address: replyNewAddress,
  data: "12345"
}

const mockLogger = mock<ILogger>()
mockLogger.log.mockImplementation((message) => {
  console.log(message)
})


let qlab: QLabWorkspace
let osc: OSC

const mockBridgePlugin = mock<OSC.BridgePlugin>()

const mockReplyMessage = mock<IOscMessage>()
const mockNoReplyMessage = mock<IOscMessage>()

const replyConnectMessage = new OSC.Message(replyConnectAddress, JSON.stringify(replyConnectData))
const onSpy = jest.spyOn(OSC.prototype, "on")

const callOnListenerCallbacks = (message: OSC.Message) => {
  for (const [event, callback] of onSpy.mock.calls) {
    if (event !== "*" && !message.address.startsWith(event.replace("/*", ""))) {
      continue
    }
    callback(message)
  }
}

describe('Bridge WS client with UDP server', () => {
  beforeEach(async () => {
    mockReplyMessage.address = "/test1"
    mockReplyMessage.args = ["string"]
    mockReplyMessage.hasReply = true
    mockNoReplyMessage.address = "/test2"
    mockNoReplyMessage.args = [123]

    mockBridgePlugin.open.mockImplementationOnce(() => {
      const [event, callback] = onSpy.mock.calls[0]!
      expect(event).toBe("open")
      callback()
      osc.send(replyConnectMessage, { receiver: 'udp' })
    })
    mockBridgePlugin.send.mockImplementationOnce(() => {
      callOnListenerCallbacks(replyConnectMessage)
    })

    osc = new OSC({ plugin: mockBridgePlugin })

    qlab = new QLabWorkspace(osc, "localhost", "53000", mockLogger)

    await qlab.initialize()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and get a reply', () => {
    const { reply } = OSC_DICTIONARY

    beforeEach(() => {
      onSpy.mockClear()
    })

    test('one message', async () => {
      qlab.listen()
      qlab.send(mockNoReplyMessage)
    })

    test('two messages', async () => {
      mockBridgePlugin.send.mockImplementationOnce((message) => {
        const [address] = new TextDecoder().decode(message).split(",")
        const replyTestMessage = new OSC.Message(reply.address + qlab.getTargetAddress(address), JSON.stringify(replyNewData))
        osc.send(replyTestMessage, { receiver: 'udp' })
        callOnListenerCallbacks(replyTestMessage)
      })

      qlab.listen()
      qlab.send(mockReplyMessage, mockNoReplyMessage)
    })
  })
})
