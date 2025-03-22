declare namespace Beat {
  enum Type {
    empty,
    heading,
    action,
    character,
    paranthetical,
    dialogue,
  }

  type Range = { location: number; length: number }

  type Line = {
    string: string // content
    position: number // index of line
    textRange: Range // of the line ({ location: ..., range: ... })
    range: Range // location and length INCLUDING line break
    type: number // an integer value, matches function type values
    typeAsString() // type as string, "Heading" / "Action" / "Dialogue" / "Parenthetical" etc.
    characterName(): string // the character name only, with possible extensions removed
    uuid: string // identifier for this line, can be used to match line to paginated and exported content
    isOutlineElement(): boolean // false for scene headings, sections and synopsis lines
    isTitlePage(): boolean // false
    isInvisible(): boolean // false
    cleanedString(): string // with non-printing stuff removed
    stripFormatting(): string // string with non-printing stuff and any Fountain formatting removed
    omitted: boolean // false
    note: boolean // the line is a note (wrapped in [[]]), true/false
    clone(): Line // a copy of the line, detached from the parser
    uuidString(): string // returns the unique identifier fo this line, which can be matched against JSON data, for example
    forSerialization(): Record<string, string | number | Beat.Range> // JSON data for the line
    setCustomData(key: string, value: string) // custom data for a key
    getCustomData(key: string): string // custom data for a key
  }

  type Scene = {
    string: string // Scene heading line / outline element as string
    typeAsString(): string // Type as string
    stringForDisplay: string // String without formatting data
    storylines: object[] // Storylines in the scene
    sceneNumber: string // Scene number (either automatically assigned or forced)
    color: string // Color name (ie. "red")
    sectionDepth: number // How deep in section hierarchy the scene is
    markerColors: string[] // Colors of all markers inside this scene
    range: Range // Location and length of the scene
    omitted: boolean // if the scene is inside an omit block, true/false
    storybeats: { storyline: string; beat: string }[] // Array of storyline names and beats
    line: Line // Serialized heading line
    ranges: { bold: Range[]; underline: Range[]; italic: Range[]; notes: Range[] } // Specific in-line ranges
  }

  type ModalInput = {
    name: string
    label: string
    type: "text" | "dropdown" | "checkbox"
    placeholder?: string
    items?: string[]
  }

  const currentParser: Parser // current parser

  function parser(stringToParse: string): Parser // create a new parser

  class Parser {
    lines: Lines[] // line objects (note: property, not a method)
    outline: Scene[] // all scene objects, including synopsis lines and sections (note: property, not a method)
    scenes: Scene[] // scene objects only (note: property, not a method)
    titlePage: object // title page elements
    linesInRange(range: Range): Line[] // get all lines in the selected range (note: parameter has to be a range object)
    lineAtIndex(index: number): Line // get line item at given character index
    sceneAtIndex(index: number): Line // get outline item at given character index
  }

  function log(message: string)
  function lines(): Line[]
  function outline(): Scene[]
  function scenes(): Scene[]
  function addString(str: string, index: number) // add string at some index
  function replaceRange(index: number, length: number, string: string) // replace a range with a string (which can be empty to remove text)
  function outlineAsJSON(): JSON // complete outline as JSON
  function scenesAsJSON(): JSON // scenes as JSON

  // Selection
  function selectedRange(): Range // returns a range object with .location and .length properties
  function setSelectedRange(location, length) // set user selection (make sure you don't go out of range)
  function scrollTo(index) // scroll to character index
  function scrollToScene(scene) // scroll to a scene object
  function scrollToLine(line) // scroll to a line object

  // Formatting
  function reformat(line) // reformat a single line in the screenplay
  function reformatRange(location, length) // reformat a range

  // Highlighting Text
  function textBackgroundHighlight(hexColor: string, location: number, length: number) // set text background color
  function textHighlight(hexColor: string, location: number, length: number) // set foreground color

  // Menu
  type Menu = {
    addItem(menuItem: MenuItem) // adds a menu item
    removeItem(menuItem: MenuItem) // removes a menu item
  }
  type MenuItem = {
    on: boolean
  }
  function menuItem(title: string, keyboardShortcuts: string[], callback: () => void): MenuItem
  function separatorMenuItem(): MenuItem
  function menu(title: string, items: MenuItem[]): Menu

  // Listeners
  function onTextChange(callback: (location: number, length: number) => void)
  function onOutlineChange(callback: (outline: Scene[]) => void)
  function onSelectionChange(callback: (location: number, length: number) => void)
  function onSceneIndexUpdate(callback: (sceneIndex: number) => void)
  let onTextChangeDisabled: boolean
  let onOutlineChangeDisabled: boolean
  let onSelectionChangeDisabled: boolean
  let onSceneIndexChangeDisabled: boolean

  function openConsole(): void

  type Window = {
    title //— window title, can be changed at any time
    resizable: boolean // — if the window can be resized by user, true by default
    runJS(evalString: string) // sends JavaScript to be evaluated in the window
    setHTML(htmlString) // — set window content (Note: This will wipe the existing JS scope in your window, and it's essentially treated as a newly-loaded page)
    setRawHTML(htmlString) //— set window content, overriding any Beat injections (Warning: You won't be able to call any Beat methods after this)
    close() //— close the window and run callback
    focus() // — make this window key window
    toggleFullScreen() // — toggle full screen mode
    isFullScreen(): boolean // — checks if the window is in full screen mode (returns true/false)
    setFrame(x, y, width, height) // — set window position and size
    getFrame() // — returns position and size for the window
    screenSize() // — returns size for the screen window has appeared on
    screenFrame() // — returns the full frame for the screen ({ x: x, y: y, width: w, height: h })
    gangWithDocumentWindow() // — attach the window to its document window (makes the window move along with the document window)
    detachFromDocumentWindow() // — detach from document window
  }

  let currentLine: Line

  type CustomFunctions = Record<string, (arg1?: unknown | unknown[]) => void>
  let custom: CustomFunctions
  function call(customFunction: (arg: object) => void, arg: object)

  type DocumentSettingPrimitive = string | number | boolean | null
  type DocumentSetting = DocumentSettingPrimitive | Record<string, DocumentSettingPrimitive>

  function getDocumentSetting(settingName: string): DocumentSetting
  function setDocumentSetting(settingName: string, settingValue: DocumentSetting): void

  type TagType = string | "sfx" | "vfx"
  interface Tag {
    range: [number, number]
    type: TagType
    definition: string
  }

  interface TagDefinition {
    name: string
    type: TagType
    id: string
  }

  interface RawDocumentSettings {
    "Print Notes": boolean
    "Review Ranges": Range[]
    "Print Synopsis": boolean
    "Revision": {
      "Removed": [],
      "RemovalSuggestion": [],
      "Addition": []
    },
    "Window Width": number
    "Stylesheet": "Screenplay" | "Novel"
    "Page Size": number
    "Sidebar Visible": false
    "Heading UUIDs": { string: string, uuid: string }[]
    "Active Plugins": []
    "Revision Level": 0
    "Window Height": number
    "pageNumberingMode": 1,
    "Print Sections": boolean,
    "Caret Position": number,
    "CharacterData": Record<string, { name: string, gender: string }>
    "Tags": Tag[]
    "TagDefinitions": TagDefinition[]
  }

  function getRawDocumentSetting(settingName: keyof RawDocumentSettings): DocumentSetting
  function setRawDocumentSetting(settingName: keyof RawDocumentSettings, settingValue: DocumentSetting): void
  function openFile(extensions: string[], callback: (filename?: string) => void): string
  function saveFile(extension: string, callback: (filename?: string) => void): void
  function assetAsString(path: string): string
  function fileToString(path: string): string
  function writeToFile(path: string, content: string): void
  function htmlWindow(ui: UI, height: number, width: number, callback: () => void): Window
  function alert(alertTitle: string, informativeText: string)
  function confirm(title: string, description: string): boolean
  function prompt(title: string, description: string, placeholder: string): string
  function modal(opts: {
    title: string
    info: string
    items: ModalInput[]
  }): Record<string, string>

  function async(backgroundFunction: () => void): void
  function sync(mainThreadFunction: () => void): void

  type Timer = {
    invalidate(): void
    stop(): void
    start(): void
    running(): boolean
  }

  function timer(seconds: number, callback: () => void, repeat: boolean = false): Timer

  function end(): void
}
