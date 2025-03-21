import { mock } from 'jest-mock-extended'
import BeatPlugin, { Mode } from '../src/data/sources/beat-plugin'
import { IOscMessage, IOscServer } from '../src/domain/abstractions/i-osc'
import OSC from 'osc-js'
import { OSC_DICTIONARY } from '../src/data/sources/qlab-workspace'

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

const connectMessage: IOscMessage = {
  address: replyDict.address + connectDict.address,
  args: [JSON.stringify({
    workspace_id: "12345",
    data: "ok:view|edit|control"
  })]
}

const test1Dict = {
  address: "/test1",
  hasReply: true
}

const test2Dict = {
  address: "/test2",
  hasReply: false
}

let messagesToSend: IOscMessage[] = []

let beat: BeatPlugin

describe('Send messages with OSC client', () => {
  const mockReplyAddress = replyDict.address + test1Dict.address

  const messageWithReply: IOscMessage = {
    address: test1Dict.address,
    args: ["string"],
    listenOn: mockReplyAddress + "/*",
  }
  const messageWithNoReply: IOscMessage = {
    address: test2Dict.address,
    args: [123],
  }

  const replyMessage: IOscMessage = {
    address: mockReplyAddress,
    args: [JSON.stringify({
      status: "ok",
      address: test1Dict.address,
      data: "12345"
    })]
  }

  beforeEach(async () => {
    mockBeatApi.log.mockImplementation((message) => {
      if (mode !== Mode.DEVELOPMENT) {
        return
      }
      console.log(message)
    })
    docSettingsSpy.mockReturnValue(serverSettings)
    beat = new BeatPlugin(mode)

    mockBeatApi.htmlWindow.mockImplementation(() => {
      mockBeatApi.custom.handleOpen!(new OSC())
      return mockBeatHtmlWindow
    })

    mockBeatHtmlWindow.runJS.mockImplementationOnce(() => {
      mockBeatApi.custom.handleReply!(JSON.stringify(connectMessage))
    })

    await beat.initialize()

    messagesToSend = [messageWithReply, messageWithNoReply]
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and wait for reply', () => {
    test('one message', async () => {
      mockBeatHtmlWindow.runJS
        //.mockImplementationOnce(() => { }) // Status display update
        .mockImplementationOnce(() => mockBeatApi.custom.handleReply!(
          JSON.stringify(replyMessage)
        ))

      await beat.send(messageWithReply)
      // expect(reply).toBeTruthy()
    })


    test('two messages', async () => {
      mockBeatHtmlWindow.runJS
        //.mockImplementationOnce(() => { }) // Status display update
        .mockImplementationOnce(() => mockBeatApi.custom.handleReply!(
          JSON.stringify(replyMessage)
        ))

      console.log("-- START TWO MESSAGES TEST")
      await beat.send(messageWithReply, messageWithNoReply)
      console.log("-- STOP TWO MESSAGES TEST")
      // expect(replies).toBeTruthy()
    })

    test('error', async () => {
      const error = "Error occurred."
      mockBeatHtmlWindow.runJS
        .mockImplementationOnce(() => mockBeatApi.custom.handleError!(
          [error, OSC.STATUS.IS_OPEN]
        ))

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
      beat.send(messageWithNoReply)
    })

    test('two messages', () => {
      beat.send(messageWithNoReply, messageWithNoReply)
    })
  })
})
