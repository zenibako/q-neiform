import { mock } from 'jest-mock-extended'
import BeatApp, { Mode } from '../src/data/sources/beat-app'
import { IOscMessage, IOscServer } from '../src/domain/abstractions/i-osc'
import OSC from 'osc-js'
import { OSC_DICTIONARY } from '../src/data/sources/qlab-app'
import { connect } from 'http2'

const mode = Mode.DEVELOPMENT

const oscServer = mock<IOscServer>()
oscServer.getDictionary.mockReturnValue(OSC_DICTIONARY)

const serverSettings = {
  host: "localhost",
  port: "8080",
  password: "12345"
}

const connectData = {
  workspace_id: "12345",
  data: "ok:view|edit|control"
}

const { reply: replyDict, connect: connectDict, new: newDict } = OSC_DICTIONARY
const replyNewAddress = replyDict.address + newDict.address
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
globalThis.Beat = mockBeatApi


const docSettingsSpy = jest.spyOn(Beat, "getDocumentSetting")

let messagesToSend: IOscMessage[] = []

let beat: BeatApp

describe('Send messages with OSC client', () => {
  const mockReplyMessage = mock<IOscMessage>()
  const mockNoReplyMessage = mock<IOscMessage>()

  beforeEach(async () => {

    mockBeatApi.log.mockImplementation((message) => {
      if (mode !== Mode.DEVELOPMENT) {
        return
      }
      console.log(message)
    })
    docSettingsSpy.mockReturnValue(serverSettings)
    beat = new BeatApp(mode)

    mockBeatApi.htmlWindow.mockImplementationOnce(() => {
      mockBeatApi.custom.handleOpen!(new OSC())
      return mockBeatHtmlWindow
    })
    mockBeatHtmlWindow.runJS.mockImplementationOnce(() => {
      mockBeatApi.custom.handleReply!(new OSC.Message(replyDict.address + connectDict.address, JSON.stringify(connectData)))
    })

    await beat.open()
    await beat.connect()

    mockReplyMessage.address = "/test1"
    mockReplyMessage.args = ["string"]
    mockReplyMessage.hasReply = true
    mockNoReplyMessage.address = "/test2"
    mockNoReplyMessage.args = [123]
    mockNoReplyMessage.hasReply = false
    messagesToSend = [mockReplyMessage, mockNoReplyMessage]
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and wait for reply', () => {
    test('one message', async () => {
      mockBeatHtmlWindow.runJS.mockImplementationOnce(() => {
        mockBeatApi.custom.handleReply!(new OSC.Message(replyNewAddress, JSON.stringify(replyNewData)))
      })
      const reply = await beat.send(mockReplyMessage)
      expect(reply).toBeTruthy()
    })


    test('two messages', async () => {
      mockBeatHtmlWindow.runJS.mockImplementationOnce(() => {
        mockBeatApi.custom.handleReply!(new OSC.Message(replyNewAddress, JSON.stringify(replyNewData)))
      })
      const replies = await beat.send(mockReplyMessage, mockNoReplyMessage)
      expect(replies).toBeTruthy()
    })

    test('error', async () => {
      const error = "Error occurred."
      mockBeatHtmlWindow.runJS.mockImplementationOnce(() => {
        mockBeatApi.custom.handleError!([error, OSC.STATUS.IS_OPEN])
      })
      try {
        await beat.send(...messagesToSend)
        fail()
      } catch (e) {
        expect((e as Error).message).toMatch(error)
      }
    })
  })

  describe('and don\'t wait for a reply', () => {
    test('one message', () => {
      beat.send(mockNoReplyMessage)
    })

    test('two messages', () => {
      beat.send(mockNoReplyMessage, mockNoReplyMessage)
    })
  })
})
