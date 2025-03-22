import { mock } from 'jest-mock-extended'
import { IOscClient } from '../../src/types/i-osc'
import PushCuesFromScript from '../../src/domain/use-cases/push-cues'
import { Scripts } from '../../src/data/repositories/scripts'
import { IScriptApp } from '../../src/types/i-script'
import ILogger from '../../src/types/i-logger'
import Cues from '../../src/data/repositories/cues'

const scriptApp = mock<IScriptApp>()
const oscClient = mock<IOscClient>()
const logger = mock<ILogger>()

describe('Push cues with OSC client', () => {
    test('one cue', () => {
      const scripts = new Scripts(scriptApp, logger)
      const cues = new Cues(oscClient, logger)
      const useCase = new PushCuesFromScript(scripts, cues, logger)

      useCase.execute()
    })
})
