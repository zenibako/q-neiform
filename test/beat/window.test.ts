import { mock } from 'jest-mock-extended'
import { IOscMessage, IOscServer } from '../../src/types/i-osc'
import OSC from 'osc-js'
import { OSC_DICTIONARY } from '../../src/data/sources/qlab/workspace'
import { BeatCustomFunctions, BeatWindow } from '../../src/types/beat/beat-types'
import IBeatApi from '../../src/types/beat/api'
import BeatWebSocketWindow from '../../src/data/sources/beat/window'

const oscServer = mock<IOscServer>()
oscServer.getDictionary.mockReturnValue(OSC_DICTIONARY)

const serverConfig = {
  host: "localhost",
  port: "8080",
  password: "12345"
}

const { reply: replyDict, connect: connectDict } = OSC_DICTIONARY
const mockBeatApi = mock<IBeatApi>()
const mockBeatHtmlWindow = mock<BeatWindow>()
const mockCustom = mock<BeatCustomFunctions & {
  handleOpen: () => void,
  handleReply: (reply: OSC.Message) => void,
}
>()
mockBeatApi.custom = mockCustom

type BeatContext = typeof globalThis & {
  Beat: IBeatApi
}

(globalThis as BeatContext).Beat = mockBeatApi

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

let webSocketWindow: BeatWebSocketWindow

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
    webSocketWindow = new BeatWebSocketWindow(serverConfig.host, serverConfig.port)
    mockBeatApi.log.mockImplementation((message) => {
      console.log(message)
    })

    mockBeatApi.htmlWindow.mockImplementation(() => {
      mockBeatApi.custom.handleOpen!(new OSC())
      return mockBeatHtmlWindow
    })

    mockBeatHtmlWindow.runJS.mockImplementationOnce(() => {
      mockBeatApi.custom.handleReply!(JSON.stringify(connectMessage))
    })

    webSocketWindow = await webSocketWindow.initialize(serverConfig.password)

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

      await webSocketWindow.send(messageWithReply)
      // expect(reply).toBeTruthy()
    })


    test('two messages', async () => {
      mockBeatHtmlWindow.runJS
        //.mockImplementationOnce(() => { }) // Status display update
        .mockImplementationOnce(() => mockBeatApi.custom.handleReply!(
          JSON.stringify(replyMessage)
        ))

      console.log("-- START TWO MESSAGES TEST")
      await webSocketWindow.send(messageWithReply, messageWithNoReply)
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
        await webSocketWindow.send(...messagesToSend)
        fail()
      } catch (e) {
        expect((e as Error).message).toMatch(error)
      }
    })
  })

  describe('and don\'t wait for a reply', () => {
    test('one message', () => {
      webSocketWindow.send(messageWithNoReply)
    })

    test('two messages', () => {
      webSocketWindow.send(messageWithNoReply, messageWithNoReply)
    })
  })
})
