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
    isOutlineElement(): boolean ///false for scene headings, sections and synopsis lines
    isTitlePage(): boolean ///false
    isInvisible(): boolean ///false
    cleanedString(): string // with non-printing stuff removed
    stripFormatting(): string // string with non-printing stuff and any Fountain formatting removed
    omitted: boolean ///false
    note: boolean // the line is a note (wrapped in [[]]), true/false
    clone(): Line // a copy of the line, detached from the parser
    uuidString(): string // returns the unique identifier fo this line, which can be matched against JSON data, for example
    forSerialization(): JSON // JSON data for the line
    setCustomData(key: string, value: object) // custom data for a key
    getCustomData(key: string): object // custom data for a key
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
}
