import { mock } from 'jest-mock-extended'
import BeatPlugin, { Mode } from '../../src/data/sources/beat/plugin'
import IBeatApi from '../../src/types/beat/api'

const mode = Mode.DEVELOPMENT

const filledServerConfig = {
  host: "localhost",
  port: "8080",
  password: "12345"
}

const mockBeatApi = mock<IBeatApi>()
type BeatContext = typeof globalThis & {
  Beat: IBeatApi
}

(globalThis as BeatContext).Beat = mockBeatApi

let plugin: BeatPlugin

describe('Interact with Beat UI', () => {

  beforeEach(async () => {
    mockBeatApi.log.mockImplementation((message) => {
      if (mode !== Mode.DEVELOPMENT) {
        return
      }
      console.log(message)
    })
    plugin = new BeatPlugin(mode)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('through modals', () => {
    test('for host and port', () => {
      const { host, port, password } = filledServerConfig
      mockBeatApi.getDocumentSetting.mockReturnValue({ password })
      mockBeatApi.modal.mockReturnValue({ address: host, port })
      const serverConfig = plugin.serverConfiguration
      expect(serverConfig).toStrictEqual(filledServerConfig)
    })
  })
})
