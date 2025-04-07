import { mock } from 'jest-mock-extended'
import { IOscClient } from '../../src/types/i-osc'
import PushCuesFromScript from '../../src/domain/use-cases/push-cues'
import ILogger from '../../src/types/i-logger'
import RemoteCues from '../../src/data/repositories/remote-cues'
import Cues from '../../src/data/repositories/cues'
import { IScriptStorage } from '../../src/types/i-script'

const cwd = mock<IScriptStorage>()
const oscClient = mock<IOscClient>()
const logger = mock<ILogger>()

describe('Push cues with OSC client', () => {
  test('one cue', () => {
    const localCues = new Cues(cwd, logger)
    const remoteCues = new RemoteCues(oscClient, cwd, logger)
    const useCase = new PushCuesFromScript(localCues, remoteCues, logger)

    useCase.execute()
  })
})
