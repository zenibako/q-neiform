import { mock } from 'jest-mock-extended'
import { IOscClient } from '../../src/types/i-osc'
import { Line } from '../../src/data/repositories/scripts'
import { OSC_DICTIONARY } from '../../src/data/sources/qlab/workspace'
import ILogger from '../../src/types/i-logger'
import RemoteCues from '../../src/data/repositories/remote-cues'

const mockOscClient = mock<IOscClient>()
const mockLogger = mock<ILogger>()

const line1 = "ALICE"
const line2 = "What's up Bob?"
const line3 = "BOB"
const line4 = "Who are you, lady?"

describe('Push cues with OSC client', () => {
  beforeEach(async () => {
    mockOscClient.getDictionary.mockReturnValue(OSC_DICTIONARY)
    mockOscClient.send.mockResolvedValueOnce([{ address: "", args: [JSON.stringify({ data: "1234" })] }])
    mockOscClient.send.mockResolvedValueOnce([{ address: "", args: [JSON.stringify({ data: "5678" })] }])
  })

  test('one cue', async () => {
    const lines = [
      { string: line1, typeAsString: "Character", range: { location: 0, length: line1.length } },
      { string: line2, typeAsString: "Dialogue", range: { location: line1.length, length: line2.length } }
    ].map(line => new Line(line))

    const cues = new RemoteCues(mockOscClient, mockLogger)
    cues.add(...lines)
    await cues.send()

    let cueCount = 0
    for (const cue of cues) {
      expect(cue.id).toBeTruthy()
      cueCount++
    }
    expect(cueCount).toBe(1)
  })

  test('two cues', async () => {
    const lines = [
      { string: line1, typeAsString: "Character", range: { location: 0, length: line1.length } },
      { string: line2, typeAsString: "Dialogue", range: { location: line1.length, length: line2.length } },
      { string: line3, typeAsString: "Character", range: { location: line2.length, length: line3.length } },
      { string: line4, typeAsString: "Dialogue", range: { location: line3.length, length: line4.length } }
    ].map(line => new Line(line))

    const cues = new RemoteCues(mockOscClient, mockLogger)
    cues.add(...lines)
    await cues.send()

    let cueCount = 0
    for (const cue of cues) {
      expect(cue.id).toBeTruthy()
      cueCount++
    }
    expect(cueCount).toBe(2)
  })
})
