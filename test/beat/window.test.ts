import { mock } from 'jest-mock-extended'
import { IOscMessage, IOscServer } from '../../src/types/i-osc'
import OSC from 'osc-js'
import { OSC_DICTIONARY } from '../../src/data/sources/qlab/workspace'
import { BeatCustomFunctions, BeatWindow } from '../../src/types/beat/beat-types'
import IBeatApi from '../../src/types/beat/api'
import BeatWebSocketWindow from '../../src/data/sources/beat/window'

// Configure server mocks
const oscServer = mock<IOscServer>()
oscServer.getDictionary.mockReturnValue(OSC_DICTIONARY)
oscServer.getTargetAddress.mockImplementation((address) => address || "/target")

const serverConfig = {
  host: "localhost",
  port: "8080",
  password: "12345"
}

// const { reply: replyDict, connect: connectDict } = OSC_DICTIONARY
const mockBeatApi = mock<IBeatApi>()
const mockBeatHtmlWindow = mock<BeatWindow>()

// Set up Beat global API
type BeatContext = typeof globalThis & {
  Beat: IBeatApi
}

(globalThis as BeatContext).Beat = mockBeatApi

describe('BeatWebSocketWindow', () => {
  let webSocketWindow: BeatWebSocketWindow

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup basic mocks that all tests need
    mockBeatApi.log.mockImplementation(() => { })
    mockBeatApi.htmlWindow.mockReturnValue(mockBeatHtmlWindow)
    mockBeatHtmlWindow.gangWithDocumentWindow.mockImplementation(() => { })

    // Create instance
    webSocketWindow = new BeatWebSocketWindow(serverConfig.host, serverConfig.port)

    // Manually set the server and window
    Object.defineProperty(webSocketWindow, '_server', {
      value: oscServer,
      writable: true
    })

    Object.defineProperty(webSocketWindow, '_window', {
      value: mockBeatHtmlWindow,
      writable: true
    })
  })

  describe('send method', () => {
    it('should send a message and return a response with reply', async () => {
      // Setup test data
      const messageWithReply: IOscMessage = {
        address: "/test",
        args: ["foo"],
        listenOn: "/reply/test/*",
      }

      const replyMessage: IOscMessage = {
        address: "/reply/test",
        args: [JSON.stringify({
          status: "ok",
          data: "success"
        })]
      }

      // Set up the custom handler before the test
      mockBeatApi.custom = {
        handleReply: jest.fn()
      } as BeatCustomFunctions

      // Mock window.runJS to simulate JavaScript execution in the Beat HTML window
      mockBeatHtmlWindow.runJS.mockImplementationOnce((jsCode) => {
        // Verify JS contains correct content
        expect(jsCode).toContain("sendMessage")
        expect(jsCode).toContain(messageWithReply.address)

        // Simulate reply by calling the custom handler
        setTimeout(() => {
          (mockBeatApi.custom!.handleReply as jest.Mock)(JSON.stringify(replyMessage))
        }, 10)
      })

      // Call the method
      const result = await webSocketWindow.send(messageWithReply)

      // Verify the result
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(replyMessage)
      expect(mockBeatHtmlWindow.runJS).toHaveBeenCalled()
    })

    it('should send multiple messages and handle the one with reply', async () => {
      // Setup test data
      const messageWithReply: IOscMessage = {
        address: "/test1",
        args: ["foo"],
        listenOn: "/reply/test1/*",
      }

      const messageWithoutReply: IOscMessage = {
        address: "/test2",
        args: [123],
      }

      const replyMessage: IOscMessage = {
        address: "/reply/test1",
        args: [JSON.stringify({
          status: "ok",
          data: "success"
        })]
      }

      // Set up the custom handler
      mockBeatApi.custom = {
        handleReply: jest.fn()
      } as BeatCustomFunctions

      // Mock window.runJS to simulate JavaScript execution
      mockBeatHtmlWindow.runJS.mockImplementationOnce((jsCode) => {
        // Verify JS contains correct content for both messages
        expect(jsCode).toContain("sendMessage")
        expect(jsCode).toContain("new OSC.Bundle")
        expect(jsCode).toContain(messageWithReply.address)
        expect(jsCode).toContain(messageWithoutReply.address)

        // Simulate reply
        setTimeout(() => {
          (mockBeatApi.custom!.handleReply as jest.Mock)(JSON.stringify(replyMessage))
        }, 10)
      })

      // Call the method
      const result = await webSocketWindow.send(messageWithReply, messageWithoutReply)

      // Verify the result
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(replyMessage)
      expect(mockBeatHtmlWindow.runJS).toHaveBeenCalled()
    })

    it('should handle errors properly', async () => {
      // Setup test data
      const message: IOscMessage = {
        address: "/test",
        args: ["foo"],
        listenOn: "/reply/test/*",
      }

      const error = "Error occurred"
      const status = OSC.STATUS.IS_OPEN

      // Set up the custom error handler
      mockBeatApi.custom = {
        handleError: jest.fn()
      } as BeatCustomFunctions

      // Mock window.runJS to simulate error
      mockBeatHtmlWindow.runJS.mockImplementationOnce(() => {
        // Trigger error handler
        setTimeout(() => {
          (mockBeatApi.custom!.handleError as jest.Mock)([error, status])
        }, 10)
      })

      // Expect rejection with error
      await expect(webSocketWindow.send(message))
        .rejects.toEqual(expect.objectContaining({
          error,
          status
        }))

      expect(mockBeatHtmlWindow.runJS).toHaveBeenCalled()
    })

    it('should resolve immediately for messages without reply', async () => {
      // Setup test data
      const messageWithoutReply: IOscMessage = {
        address: "/test",
        args: [123],
      }

      // No custom handlers needed for this test
      mockBeatApi.custom = {} as BeatCustomFunctions

      // Mock window.runJS
      mockBeatHtmlWindow.runJS.mockImplementationOnce((jsCode) => {
        expect(jsCode).toContain("sendMessage")
        expect(jsCode).toContain(messageWithoutReply.address)
      })

      // Call the method
      const result = await webSocketWindow.send(messageWithoutReply)

      // Verify empty result since no replies expected
      expect(result).toEqual([])
      expect(mockBeatHtmlWindow.runJS).toHaveBeenCalled()
    })
  })

  describe('utility methods', () => {
    it('getDictionary() returns the OSC dictionary', () => {
      const dictionary = webSocketWindow.getDictionary()
      expect(dictionary).toBe(OSC_DICTIONARY)
    })

    it('getTargetAddress() forwards call to server', () => {
      const testAddress = "/test/address"
      webSocketWindow.getTargetAddress(testAddress)
      expect(oscServer.getTargetAddress).toHaveBeenCalledWith(testAddress)
    })

    it('updateStatusDisplay() calls runJS with status text', () => {
      const statusText = "Test Status"
      webSocketWindow.updateStatusDisplay(statusText)
      expect(mockBeatHtmlWindow.runJS).toHaveBeenCalledWith(
        expect.stringContaining(statusText)
      )
    })

    it('close() closes OSC connection and window', () => {
      webSocketWindow.close()
      expect(mockBeatHtmlWindow.runJS).toHaveBeenCalledWith("osc.close()")
      expect(mockBeatHtmlWindow.close).toHaveBeenCalled()
    })
  })
})
