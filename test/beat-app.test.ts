import { mock } from 'jest-mock-extended'
import { ICueApp } from '../src/domain/abstractions/i-cues'
import BeatApp, { Mode } from '../src/data/sources/beat-app'
import { IOscClient, IOscServer } from '../src/domain/abstractions/i-osc'
import OSC from 'osc-js'
import Cues from '../src/data/repositories/cues'
import ILogger from '../src/domain/abstractions/i-logger'
import { Line } from '../src/data/repositories/scripts'

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
const dict = {
  connect: {
    address: "/connect"
  },
  name: {
    address: "/name"
  },
  new: {
    address: "/new"
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
  mockBeatApi.custom.handleOpen!(null)
  mockBeatApi.custom.handleReply!(new OSC.Message(dict.connect.address, JSON.stringify(connectData)))
  return mockBeatHtmlWindow
})
mockBeatApi.log.mockImplementation((message) => console.log(message))

const handleReplySpy = jest.spyOn(mockCustom, "handleReply")

globalThis.Beat = mockBeatApi
const beat = new BeatApp(Mode.DEVELOPMENT)

const mockCueApp = mock<ICueApp>()
const mockLogger = mock<ILogger>()
const mockOscClient = mock<IOscClient>()

const line1 = "ALICE"
const line2 = "What's up Bob?"
const line3 = "BOB"
const line4 = "Who are you, lady?"

const lines = [
  { string: line1, typeAsString: "Character", range: { location: 0, length: line1.length } },
  { string: line2, typeAsString: "Dialogue", range: { location: line1.length, length: line2.length } },
  { string: line3, typeAsString: "Character", range: { location: line2.length, length: line3.length } },
  { string: line4, typeAsString: "Dialogue", range: { location: line3.length, length: line4.length } }
].map(line => new Line(line))

const cues = new Cues(mockCueApp, mockOscClient, mockLogger)
cues.addFromLines(lines)

const docSettingsSpy = jest.spyOn(Beat, "getDocumentSetting")

describe('Push cues with OSC client', () => {
  beforeEach(async () => {
    docSettingsSpy.mockReturnValue(serverSettings)
    await beat.connect(oscServer)
  })

  test('one cue', async () => {
    mockBeatHtmlWindow.runJS.mockImplementation((address: string) => {
      if (address.startsWith("sendMessage(")) {
        mockBeatApi.custom.handleReply!(new OSC.Message(replyNewAddress, JSON.stringify(replyNewData)))
      }
    })

    await beat.sendCues(cues)
    for (const cue of cues) {
      expect(cue.id).toBeTruthy()
    }
  })
})
