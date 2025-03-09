import { mock } from 'jest-mock-extended'
import { IOscMessage } from '../src/domain/abstractions/i-osc'
import OSC from 'osc-js'
import { OSC_DICTIONARY, QLabWorkspace } from '../src/data/sources/qlab-app'
import ILogger from '../src/domain/abstractions/i-logger'
import { EventEmitterAsyncResource } from 'ws'

const connectData = {
  workspace_id: "12345",
  data: "ok:view|edit|control"
}

const replyConnectAddress = OSC_DICTIONARY.reply.address + OSC_DICTIONARY.connect.address
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

let messagesToSend: IOscMessage[] = []
let connectResponse
const replyConnectMessage = new OSC.Message(replyConnectAddress, JSON.stringify(connectData))
const onSpy = jest.spyOn(OSC.prototype, "on")

describe('Bridge WS client with UDP server', () => {
  beforeEach(async () => {
    const mockMessage1 = mock<IOscMessage>()
    mockMessage1.address = "/test1"
    mockMessage1.args = ["string"]
    const mockMessage2 = mock<IOscMessage>()
    mockMessage2.address = "/test2"
    mockMessage2.args = [123]
    messagesToSend = [mockMessage1, mockMessage2]

    mockBridgePlugin.open.mockImplementation(() => osc.send(replyConnectMessage))

    onSpy.mockImplementationOnce((event, callback) => {
      expect(event).toBe("open")
      callback()
      return 1
    })
    onSpy.mockImplementationOnce((event, callback) => {
      expect(event).toBe(replyConnectAddress)
      callback(replyConnectMessage)
      return 2
    })


    osc = new OSC({ plugin: mockBridgePlugin })

    qlab = new QLabWorkspace(osc, mockLogger)
    connectResponse = await qlab.connect()
    expect(connectResponse).toBe("Successfully connected.")
  })


  describe('and get a reply', () => {
    const wildcardAddress = "/*"
    const { reply } = OSC_DICTIONARY

    test('one message', async () => {
      const testAddress = qlab.getTargetAddress("/test1")
      const testMessage = new OSC.Message(testAddress)
      mockBridgePlugin.send.mockImplementation((message) => {
        const [address, ...args] = new TextDecoder().decode(message).split(",")
        const replyNewMessage = new OSC.Message(reply.address + qlab.getTargetAddress(address), ...args)
        onSpy.mockImplementationOnce((event, callback) => {
          if (event.startsWith(reply.address)) {
            expect(event).toBe("/reply" + qlab.getTargetAddress(wildcardAddress))
            expect(replyNewMessage.address).toMatch(new RegExp(event))
            callback(replyNewMessage)
          } else {
            expect(event).toBe(qlab.getTargetAddress(wildcardAddress))
            expect(testAddress).toMatch(new RegExp(event))
            callback(testMessage)
            osc.send(replyNewMessage)
          }
          return 4
        })
        onSpy.mockImplementationOnce((event, callback) => {
          expect(event).toBe(qlab.getTargetAddress(wildcardAddress))
          expect(replyNewMessage.address).toMatch(new RegExp(event))
          callback(replyNewMessage)
          return 5
        })
        onSpy.mockImplementationOnce((event, callback) => {
          expect(event).toBe("/reply" + qlab.getTargetAddress(wildcardAddress))
          expect(replyNewMessage.address).toMatch(new RegExp(event))
          callback(replyNewMessage)
          return 6
        })
        onSpy.mockImplementationOnce((event, callback) => {
          expect(event).toBe("*")
          callback(replyNewMessage)
          return 7
        })
        onSpy.mockImplementationOnce((event, callback) => {
          expect(event).toBe("/reply" + qlab.getTargetAddress(wildcardAddress))
          expect(replyNewMessage.address).toMatch(new RegExp(event))
          callback(replyNewMessage)
          return 8
        })
        onSpy.mockImplementationOnce((event, callback) => {
          expect(event).toBe("*")
          callback(replyNewMessage)
          return 9
        })
        qlab.listen()
      })

      qlab.send(testMessage)

      expect(onSpy).toHaveBeenCalledTimes(9)
      expect(mockBridgePlugin.send).toHaveBeenCalledTimes(3)
    })
  })
})
