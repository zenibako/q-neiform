import { mock } from 'jest-mock-extended'
import BeatApp, { Mode } from '../src/data/sources/beat-app'
import { IOscMessage, IOscDictionary, IOscServer } from '../src/domain/abstractions/i-osc'
import OSC from 'osc-js'

/*
const beatApi: typeof Beat = {
  openConsole: () => {},
  log: (message) => { console.log(message) },
  lines: jest.fn(),
  parser: jest.fn(),
  outline: jest.fn(),
  scenes: jest.fn(),
}
*/

const oscServer = mock<IOscServer>()
const dict: IOscDictionary = {
  workspace: {
    address: "/workspace"
  },
  connect: {
    address: "/connect"
  },
  name: {
    address: "/name"
  },
  new: {
    address: "/new"
  },
  mode: {
    address: "/mode"
  },
  reply: {
    address: "/reply"
  }
}
Object.assign(oscServer, { dict })

const serverSettings = {
  host: "localhost",
  port: "8080",
  password: "12345"
}

const connectData = {
  workspace_id: "12345",
  data: "ok:view|edit|control"
}

const replyNewAddress = dict.reply.address + dict.new.address
const replyNewData = {
  status: "ok",
  address: replyNewAddress,
  data: "12345"
}

type BeatCustomFunctions = Beat.CustomFunctions & {
  handleOpen: () => void,
  handleReply: (reply: OSC.Message) => void,
}

const mockBeatApi = mock<typeof Beat>()
const mockBeatHtmlWindow = mock<Beat.Window>()
mockBeatApi.assetAsString.mockReturnValue(`<span id="status">Connecting to bridge at localhost:8080...</span>`)
const mockCustom = mock<BeatCustomFunctions>()
mockBeatApi.custom = mockCustom
mockBeatApi.htmlWindow.mockImplementation(() => {
  mockBeatApi.custom.handleOpen!()
  mockBeatApi.custom.handleReply!(new OSC.Message(dict.connect.address, JSON.stringify(connectData)))
  return mockBeatHtmlWindow
})
mockBeatApi.log.mockImplementation((message) => console.log(message))
globalThis.Beat = mockBeatApi

const beat = new BeatApp(Mode.DEVELOPMENT)

const docSettingsSpy = jest.spyOn(Beat, "getDocumentSetting")

const mockMessages: IOscMessage[] = []

describe('Send messages with OSC client', () => {
  beforeEach(async () => {
    docSettingsSpy.mockReturnValue(serverSettings)
    await beat.connect(oscServer)

    const mockMessage1 = mock<IOscMessage>()
    mockMessage1.address = "/test2"
    mockMessage1.args = ["string"]
    const mockMessage2 = mock<IOscMessage>()
    mockMessage2.address = "/test2"
    mockMessage2.args = [123]
    mockMessages.push(mockMessage1, mockMessage2)
  })

  let replyCount = 0
  describe('and wait for reply', () => {
    beforeEach(() => {
      mockBeatHtmlWindow.runJS.mockImplementation((jsString: string) => {
        if (jsString.startsWith("send")) {
          mockBeatApi.custom.handleReply!(new OSC.Message(replyNewAddress, JSON.stringify(replyNewData)))
          replyCount++
        }
      })
    })

    afterEach(() => {
      replyCount = 0
    })

    test('one message', async () => {
      const reply = await beat.sendAndWaitForReply(mockMessages[0]!)
      expect(reply).toBeTruthy()
    })

    test('two messages', async () => {
      const replies = await beat.sendAndWaitForReply(...mockMessages)
      expect(replies).toBeTruthy()
    })
  })

  describe('and don\'t wait for a reply', () => {
    test('one message', () => {
      beat.send(mockMessages[0]!)
      expect(replyCount).toBe(1)
    })

    test('two messages', () => {
      beat.send(...mockMessages)
      expect(replyCount).toBe(2)
    })
  })
})
