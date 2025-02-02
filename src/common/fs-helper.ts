import fs from "fs"
import { IFile } from "../domain/abstractions/IFile"

export function readFile(file: IFile): unknown {
    if (!fs.existsSync(file.filepath)) {
        throw new Error('File does not exist')
    }

    const stat = fs.statSync(file.filepath);
    if (!stat.size) {
        throw new Error('File is empty')
    }

    return fs.readFileSync(file.filepath, {encoding: 'utf8', flag: 'r'})
}
