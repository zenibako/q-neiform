enum Type {
  empty,
  heading,
  action,
  character,
  paranthetical,
  dialogue,
}

export type BeatCustomFunctions = Record<string, (arg1?: unknown | unknown[]) => void>

export type BeatRange = { location: number; length: number }

export type BeatLine = {
  string: string // content
  position: number // index of line
  textRange: BeatRange // of the line ({ location: ..., range: ... })
  range: BeatRange // location and length INCLUDING line break
  type: number // an integer value, matches function type values
  typeAsString(): string // type as string, "Heading" / "Action" / "Dialogue" / "Parenthetical" etc.
  characterName(): string // the character name only, with possible extensions removed
  uuid: string // identifier for this line, can be used to match line to paginated and exported content
  isOutlineElement(): boolean // false for scene headings, sections and synopsis lines
  isTitlePage(): boolean // false
  isInvisible(): boolean // false
  cleanedString(): string // with non-printing stuff removed
  stripFormatting(): string // string with non-printing stuff and any Fountain formatting removed
  omitted: boolean // false
  note: boolean // the line is a note (wrapped in [[]]), true/false
  clone(): BeatLine // a copy of the line, detached from the parser
  uuidString(): string // returns the unique identifier fo this line, which can be matched against JSON data, for example
  forSerialization(): Record<string, string | number | BeatRange> // JSON data for the line
  setCustomData(key: string, value: string): void // custom data for a key
  getCustomData(key: string): string // custom data for a key
}

export type BeatScene = {
  string: string // Scene heading line / outline element as string
  typeAsString(): string // Type as string
  stringForDisplay: string // String without formatting data
  storylines: object[] // Storylines in the scene
  sceneNumber: string // Scene number (either automatically assigned or forced)
  color: string // Color name (ie. "red")
  sectionDepth: number // How deep in section hierarchy the scene is
  markerColors: string[] // Colors of all markers inside this scene
  range: BeatRange // Location and length of the scene
  omitted: boolean // if the scene is inside an omit block, true/false
  storybeats: { storyline: string; beat: string }[] // Array of storyline names and beats
  line: BeatLine // Serialized heading line
  ranges: { bold: BeatRange[]; underline: BeatRange[]; italic: BeatRange[]; notes: BeatRange[] } // Specific in-line ranges
}

export type BeatModalInput = {
  name: string
  label: string
  type: "text" | "dropdown" | "checkbox"
  placeholder?: string
  items?: string[]
}


type BeatTagType = string | "sfx" | "vfx"
export interface BeatTag {
  range: [number, number]
  type: BeatTagType
  definition: string
}
export interface BeatTagDefinition {
  name: string
  type: BeatTagType
  id: string
}

export interface BeatRawDocumentSettings {
  "Print Notes": boolean
  "Review Ranges": BeatRange[]
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
  "Tags": BeatTag[]
  "TagDefinitions": BeatTagDefinition[]
}

export interface BeatParser {
  lines: BeatLine[] // line objects (note: property, not a method)
  outline: BeatScene[] // all scene objects, including synopsis lines and sections (note: property, not a method)
  scenes: BeatScene[] // scene objects only (note: property, not a method)
  titlePage: object // title page elements
  linesInRange(range: BeatRange): BeatLine[] // get all lines in the selected range (note: parameter has to be a range object)
  lineAtIndex(index: number): BeatLine // get line item at given character index
  sceneAtIndex(index: number): BeatLine // get outline item at given character index
}

export type BeatTimer = {
  invalidate(): void
  stop(): void
  start(): void
  running(): boolean
}

type Frame = Position & Size

type Position = {
  x: number
  y: number
}

type Size = {
  width: number
  height: number
}

export type BeatWindow = {
  title: string //— window title, can be changed at any time
  resizable: boolean // — if the window can be resized by user, true by default
  runJS(evalString: string): void // sends JavaScript to be evaluated in the window
  setHTML(htmlString: string): void // — set window content (Note: This will wipe the existing JS scope in your window, and it's essentially treated as a newly-loaded page)
  setRawHTML(htmlString: string): void //— set window content, overriding any Beat injections (Warning: You won't be able to call any Beat methods after this)
  close(): void //— close the window and run callback
  focus(): void // — make this window key window
  toggleFullScreen(): void // — toggle full screen mode
  isFullScreen(): boolean // — checks if the window is in full screen mode (returns true/false)
  setFrame(x: number, y: number, width: number, height: number): void // — set window position and size
  getFrame(): Frame // — returns position and size for the window
  screenSize(): Size // — returns size for the screen window has appeared on
  screenFrame(): Frame // — returns the full frame for the screen ({ x: x, y: y, width: w, height: h })
  gangWithDocumentWindow(): void // — attach the window to its document window (makes the window move along with the document window)
  detachFromDocumentWindow(): void // — detach from document window
}

// Menu
export type BeatMenu = {
  addItem(menuItem: BeatMenuItem): void // adds a menu item
  removeItem(menuItem: BeatMenuItem): void // removes a menu item
}

export type BeatMenuItem = {
  on: boolean
}
