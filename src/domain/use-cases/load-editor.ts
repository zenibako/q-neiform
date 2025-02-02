import { Interfaces } from "../../data/repositories/interfaces";

export default class LoadEditorPlugin {
  constructor(private interfaces: Interfaces) {}

  execute() {
    this.interfaces.initializeMenu()
  }
}
