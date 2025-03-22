import { BeatLine, BeatRange, BeatScene, BeatParser, BeatRawDocumentSettings, BeatMenu, BeatMenuItem, BeatModalInput, BeatTimer, BeatWindow, BeatCustomFunctions } from "./beat-types"

type DocumentSettingPrimitive = string | number | boolean | null
type DocumentSetting = DocumentSettingPrimitive | Record<string, DocumentSettingPrimitive>

type RawDocumentSettingValue<T extends keyof BeatRawDocumentSettings> = BeatRawDocumentSettings[T]

export default interface IBeatApi {
  currentParser: BeatParser // current parser

  parser(stringToParse: string): BeatParser // create a new parser

  log(message: string): void
  lines(): BeatLine[]
  outline(): BeatScene[]
  scenes(): BeatScene[]
  addString(str: string, index: number): void // add string at some index
  replaceRange(index: number, length: number, string: string): void // replace a range with a string (which can be empty to remove text)
  outlineAsJSON(): object // complete outline as JSON
  scenesAsJSON(): object // scenes as JSON

  // Selection
  selectedRange(): BeatRange // returns a range object with .location and .length properties
  setSelectedRange(location: number, length: number): void // set user selection (make sure you don't go out of range)
  scrollTo(index: number): void // scroll to character index
  scrollToScene(scene: BeatScene): void // scroll to a scene object
  scrollToLine(line: BeatLine): void // scroll to a line object

  // Formatting
  reformat(line: BeatLine): void // reformat a single line in the screenplay
  reformatRange(location: number, length: number): void // reformat a range

  // Highlighting Text
  textBackgroundHighlight(hexColor: string, location: number, length: number): void // set text background color
  textHighlight(hexColor: string, location: number, length: number): void // set foreground color

  // Menu
  menuItem(title: string, keyboardShortcuts: string[], callback: () => void): BeatMenuItem
  separatorMenuItem(): BeatMenuItem
  menu(title: string, items: BeatMenuItem[]): BeatMenu

  // Listeners
  onTextChange(callback: (location: number, length: number) => void): void
  onOutlineChange(callback: (outline: BeatScene[]) => void): void
  onSelectionChange(callback: (location: number, length: number) => void): void
  onSceneIndexUpdate(callback: (sceneIndex: number) => void): void
  onTextChangeDisabled: boolean
  onOutlineChangeDisabled: boolean
  onSelectionChangeDisabled: boolean
  onSceneIndexChangeDisabled: boolean

  openConsole(): void

  currentLine: BeatLine

  custom: BeatCustomFunctions
  call(customFunction: (arg: object) => void, arg: object): void

  getDocumentSetting(settingName: string): DocumentSetting
  setDocumentSetting(settingName: string, settingValue: DocumentSetting): void

  getRawDocumentSetting<T extends keyof BeatRawDocumentSettings>(settingName: T): RawDocumentSettingValue<T>
  setRawDocumentSetting<T extends keyof BeatRawDocumentSettings>(settingName: T, settingValue: RawDocumentSettingValue<T>): void
  openFile(extensions: string[], callback: (filename?: string) => void): string
  saveFile(extension: string, callback: (filename?: string) => void): void
  assetAsString(path: string): string
  fileToString(path: string): string
  writeToFile(path: string, content: string): void
  htmlWindow(ui: string, height: number, width: number, callback: () => void): BeatWindow
  alert(alertTitle: string, informativeText: string): void
  confirm(title: string, description: string): boolean
  prompt(title: string, description: string, placeholder: string): string
  modal(opts: {
    title: string
    info: string
    items: BeatModalInput[]
  }): Record<string, string>

  async(backgroundFunction: () => void): void
  sync(mainThreadFunction: () => void): void
  timer(seconds: number, callback: () => void, repeat?: boolean): BeatTimer

  end(): void
}
