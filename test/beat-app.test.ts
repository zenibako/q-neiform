import { mock } from 'jest-mock-extended'
import BeatApp, { Mode } from '../src/data/sources/beat-app'
import { IOscMessage, IOscServer } from '../src/domain/abstractions/i-osc'
import OSC from 'osc-js'
import { OSC_DICTIONARY } from '../src/data/sources/qlab-app'

const mode = Mode.DEVELOPMENT

const oscServer = mock<IOscServer>()
oscServer.getDictionary.mockReturnValue(OSC_DICTIONARY)

const serverSettings = {
  host: "localhost",
  port: "8080",
  password: "12345"
}

const { reply: replyDict, connect: connectDict } = OSC_DICTIONARY
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

const connectMessage = new OSC.Message(
  replyDict.address + connectDict.address,
  JSON.stringify({
    workspace_id: "12345",
    data: "ok:view|edit|control"
  })
)

const test1Dict = {
  address: "/test1",
  hasReply: true
}

const test2Dict = {
  address: "/test2",
  hasReply: false
}

let messagesToSend: IOscMessage[] = []

let beat: BeatApp

describe('Send messages with OSC client', () => {
  const mockReplyAddress = replyDict.address + test1Dict.address

  const mockReplyMessage: IOscMessage = {
    address: test1Dict.address,
    args: ["string"],
    listenOn: mockReplyAddress + "/*",
  }
  const mockNoReplyMessage: IOscMessage = {
    address: test2Dict.address,
    args: [123],
  }

  const replyNewData = {
    status: "ok",
    address: mockReplyAddress,
    data: "12345"
  }

  beforeEach(async () => {
    mockBeatApi.log.mockImplementation((message) => {
      if (mode !== Mode.DEVELOPMENT) {
        return
      }
      console.log(message)
    })
    docSettingsSpy.mockReturnValue(serverSettings)
    beat = new BeatApp(mode)

    mockBeatApi.htmlWindow.mockImplementation(() => {
      mockBeatApi.custom.handleOpen!(new OSC())
      return mockBeatHtmlWindow
    })

    mockBeatHtmlWindow.runJS.mockImplementationOnce(() => {
      mockBeatApi.custom.handleReply!(JSON.stringify(connectMessage))
    })

    await beat.initialize()

    messagesToSend = [mockReplyMessage, mockNoReplyMessage]
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and wait for reply', () => {
    test('one message', async () => {
      mockBeatHtmlWindow.runJS.mockImplementationOnce(
        () => mockBeatApi.custom.handleReply!(
          JSON.stringify(new OSC.Message(mockReplyAddress, JSON.stringify(replyNewData)))
        )
      )

      const reply = await beat.send(mockReplyMessage)
      expect(reply).toBeTruthy()
    })


    test('two messages', async () => {
      mockBeatHtmlWindow.runJS.mockImplementationOnce(
        () => mockBeatApi.custom.handleReply!(
          JSON.stringify(new OSC.Message(mockReplyAddress, JSON.stringify(replyNewData)))
        )
      )

      console.log("-- START TWO MESSAGES TEST")
      const replies = await beat.send(mockReplyMessage, mockNoReplyMessage)
      console.log("-- STOP TWO MESSAGES TEST")
      expect(replies).toBeTruthy()
    })

    test('error', async () => {
      const error = "Error occurred."
      mockBeatHtmlWindow.runJS.mockImplementationOnce(
        () => mockBeatApi.custom.handleError!([error, OSC.STATUS.IS_OPEN])
      )

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
