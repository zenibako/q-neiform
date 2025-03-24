import { mock } from 'jest-mock-extended'
import { IOscClient } from '../../src/types/i-osc'
import PushCuesFromScript from '../../src/domain/use-cases/push-cues'
import ILogger from '../../src/types/i-logger'
import RemoteCues from '../../src/data/repositories/remote-cues'
import LocalCues from '../../src/data/repositories/local-cues'
import CurrentWorkingDirectory from '../../src/data/sources/fs/cwd'

const cwd = mock<CurrentWorkingDirectory>()
const oscClient = mock<IOscClient>()
const logger = mock<ILogger>()

describe('Push cues with OSC client', () => {
  test('one cue', () => {
    const localCues = new LocalCues(cwd, logger)
    const remoteCues = new RemoteCues(oscClient, logger)
    const useCase = new PushCuesFromScript(localCues, remoteCues, logger)

    useCase.execute()
  })
})
