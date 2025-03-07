import { mock } from 'jest-mock-extended'
import { IOscMessage } from '../src/domain/abstractions/i-osc'
import OSC from 'osc-js'
import { OSC_DICTIONARY, QLabWorkspace } from '../src/data/sources/qlab-app'
import ILogger from '../src/domain/abstractions/i-logger'
import { Server } from 'https'
import { WebSocket } from 'ws'

const mockHttpsServer = mock<Server>()
const mockWsServer = mock<WebSocket>()

jest.mock('https', () => ({
  Server: jest.fn().mockImplementation(() => mockHttpsServer)
}));

jest.mock('ws', () => ({
  WebSocket: jest.fn().mockImplementation(() => mockWsServer)
}));


const connectData = {
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

const qlab = new QLabWorkspace(mockLogger)

let messagesToSend: IOscMessage[] = []
let connectResponse

describe('Bridge WS client with UDP server', () => {
  beforeEach(async () => {
    const mockMessage1 = mock<IOscMessage>()
    mockMessage1.address = "/test1"
    mockMessage1.args = ["string"]
    const mockMessage2 = mock<IOscMessage>()
    mockMessage2.address = "/test2"
    mockMessage2.args = [123]
    messagesToSend = [mockMessage1, mockMessage2]

    connectResponse = await qlab.bridge()
    expect(connectResponse).toBe("Successfully connected.")
  })

  let replyMessage: OSC.Message | null
  let replyError: [string, number] | null

  let replyCount = 0
  describe('and wait for reply', () => {
    beforeEach(() => {
        replyCount++
    })

    afterEach(() => {
      replyMessage = null
      replyError = null
      replyCount = 0
    })

    test('one message', async () => {
      mockHttpsServer.emit("replyMessage")
    })
  })
})
