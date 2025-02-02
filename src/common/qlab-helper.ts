class QLabCue {
    number: number
    uniqueID: string

    constructor(number: number, uniqueID: string) {
        this.number = number
        this.uniqueID = uniqueID
    }
}

class QLabMapping {
    [index: number]: unknown

    set(cue: QLabCue) {
        const { number, uniqueID } = cue
        this[number] = uniqueID
        return this
    }
}

export function getMapping(input: unknown, lastMapping = {}) {
    const arr = Array.isArray(input) ? input : [ input ];
    return arr.reduce((newMapping, { cues = [] } = {}) => {
        return {
            ...newMapping,
            ...cues.reduce(
                (qlabObj: QLabMapping, cue: QLabCue) => ({ ...getMapping(cue, qlabObj), ...mapCue(cue, qlabObj) }
                ), {})
        };
    }, lastMapping)
}

function mapCue(cue: QLabCue, mapping: QLabMapping) {
   return cue.number ? mapping.set(cue) : mapping
}