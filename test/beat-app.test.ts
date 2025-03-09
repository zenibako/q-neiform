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

const connectData = {
  workspace_id: "12345",
  data: "ok:view|edit|control"
}

const { reply: replyDict, new: newDict } = OSC_DICTIONARY
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
mockBeatApi.htmlWindow.mockImplementation(() => {
  mockBeatApi.custom.handleOpen!(new OSC())
  mockBeatApi.custom.handleReply!(new OSC.Message(replyDict.address, JSON.stringify(connectData)))
  return mockBeatHtmlWindow
})

mockBeatApi.log.mockImplementation((message) => {
  if (mode !== Mode.DEVELOPMENT) {
    return
  }
  console.log(message)
})
globalThis.Beat = mockBeatApi

const beat = new BeatApp(mode)

const docSettingsSpy = jest.spyOn(Beat, "getDocumentSetting")

let messagesToSend: IOscMessage[] = []

describe('Send messages with OSC client', () => {
  beforeEach(async () => {
    docSettingsSpy.mockReturnValue(serverSettings)
    await beat.connect()

    const mockMessage1 = mock<IOscMessage>()
    mockMessage1.address = "/test1"
    mockMessage1.args = ["string"]
    const mockMessage2 = mock<IOscMessage>()
    mockMessage2.address = "/test2"
    mockMessage2.args = [123]
    messagesToSend = [mockMessage1, mockMessage2]
  })

  let replyMessage: OSC.Message | null
  let replyError: [string, number] | null

  let replyCount = 0
  describe('and wait for reply', () => {
    beforeEach(() => {
      mockBeatHtmlWindow.runJS.mockImplementation((jsString: string) => {
        if (!jsString.startsWith("send")) {
          return
        }

        if (replyMessage) {
          mockBeatApi.custom.handleReply!(replyMessage)
        }

        if (replyError) {
          mockBeatApi.custom.handleError!(replyError)
        }
        
        replyCount++
      })
    })

    afterEach(() => {
      replyMessage = null
      replyError = null
      replyCount = 0
    })

    test('one message', async () => {
      replyMessage = new OSC.Message(replyNewAddress, JSON.stringify(replyNewData))
      const reply = await beat.sendAndWaitForReply(messagesToSend[0]!)
      expect(reply).toBeTruthy()
    })

    test('two messages', async () => {
      replyMessage = new OSC.Message(replyNewAddress, JSON.stringify(replyNewData))
      const replies = await beat.sendAndWaitForReply(...messagesToSend)
      expect(replies).toBeTruthy()
    })

    test('error', async () => {
      const error = "Error occurred."
      replyError = [error, OSC.STATUS.IS_OPEN]
      try {
        await beat.sendAndWaitForReply(...messagesToSend)
        fail()
      } catch(e) {
        expect(e).toBe(error)
      }
    })
  })

  describe('and don\'t wait for a reply', () => {
    test('one message', () => {
      beat.send(messagesToSend[0]!)
      expect(replyCount).toBe(1)
    })

    test('two messages', () => {
      beat.send(...messagesToSend)
      expect(replyCount).toBe(2)
    })
  })
})
