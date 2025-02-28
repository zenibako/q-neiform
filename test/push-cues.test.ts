import { mock } from 'jest-mock-extended'
import { IOscClient } from '../src/domain/abstractions/i-osc'
import PushCuesFromScript from '../src/domain/use-cases/push-cues'
import { Scripts } from '../src/data/repositories/scripts'
import { IScriptApp } from '../src/domain/abstractions/i-script'
import ILogger from '../src/domain/abstractions/i-logger'
import Cues from '../src/data/repositories/cues'
import { ICueApp } from '../src/domain/abstractions/i-cues'

const cueApp = mock<ICueApp>()
const scriptApp = mock<IScriptApp>()
const oscClient = mock<IOscClient>()
const logger = mock<ILogger>()

describe('Push cues with OSC client', () => {
    test('one cue', () => {
      const scripts = new Scripts(scriptApp, logger)
      const cues = new Cues(cueApp, oscClient, logger)
      const useCase = new PushCuesFromScript(scripts, cues, logger)

      useCase.execute()
    })
})
