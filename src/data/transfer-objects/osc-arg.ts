class Value {
    data?: JSON

    constructor(value: object, data?: string) {
        Object.assign(this, value)
        if (data) {
            this.data = JSON.parse(data)
        }
    }
}

export default class OscArg {
    value: Value
    type?: string
    status?: string

    constructor(value: unknown) {
        if (typeof value === 'string') {
            this.type = 's'
        } else if (typeof value === 'number') {
            this.type = 'f'
        }
        this.value = new Value(value as object)
    }

    parse(): JSON {
        if (!this.status) {
            throw new Error('This arg is not ready to be parsed')
        }
        
        if (this.status !== 'ok') {
            throw new Error(`Unsuccessful status thrown: ${this.status}`)
        }

        if (!this.value) {
            throw new Error('Value is not populated')
        }

        if (typeof this.value !== 'object') {
            throw new Error(`Value cannot be parsed: ${this.value}`)
        }

        const value = new Value(this.value)
        if (!value.data) {
            throw new Error(`Data was not found`)
        }

        return value.data
    }
}
