import { mock } from 'jest-mock-extended'
import { ICueApp } from '../src/domain/abstractions/i-cues'
import { IOscClient, IOscServer } from '../src/domain/abstractions/i-osc'
import Cues from '../src/data/repositories/cues'
import ILogger from '../src/domain/abstractions/i-logger'
import { Line } from '../src/data/repositories/scripts'

const oscServer = mock<IOscServer>()
const dict = {
  connect: {
    address: "/connect"
  },
  workspace: {
    address: "/workspace"
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

const mockCueApp = mock<ICueApp>()
const mockLogger = mock<ILogger>()
const mockOscClient = mock<IOscClient>()

const line1 = "ALICE"
const line2 = "What's up Bob?"
const line3 = "BOB"
const line4 = "Who are you, lady?"

describe('Push cues with OSC client', () => {
  beforeEach(async () => {
    mockOscClient.getDictionary.mockReturnValue(dict)
    mockOscClient.sendAndWaitForReply.mockResolvedValueOnce("1234")
    mockOscClient.sendAndWaitForReply.mockResolvedValueOnce("5678")
  })

  test('one cue', async () => {
    const lines = [
      { string: line1, typeAsString: "Character", range: { location: 0, length: line1.length } },
      { string: line2, typeAsString: "Dialogue", range: { location: line1.length, length: line2.length } }
    ].map(line => new Line(line))

    const cues = new Cues(mockOscClient, mockLogger)
    cues.addFromLines(lines)
    await cues.push()
    
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

    const cues = new Cues(mockOscClient, mockLogger)
    cues.addFromLines(lines)
    await cues.push()

    let cueCount = 0
    for (const cue of cues) {
      expect(cue.id).toBeTruthy()
      cueCount++
    }
    expect(cueCount).toBe(2)
  })
})
