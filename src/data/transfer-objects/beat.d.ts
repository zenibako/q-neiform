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

  let custom: Record<string, (arg1: unknown | unknown[]) => void>
  function call(customFunction: (arg: object) => void, arg: object)

  function assetAsString(path: string): string
  function htmlWindow(ui: UI, height: number, width: number, callback: () => void): Window
  function alert(alertTitle: string, informativeText: string)
  function confirm(title: string, description: string): boolean
  function prompt(title: string, description: string, placeholder: string): string
  function modal(opts: {
    title: string
    info: string
    items: ModalInput[]
  }): Record<string, string>

  function end(): void
}
