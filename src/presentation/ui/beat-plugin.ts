import { Interfaces } from "../../data/repositories/interfaces";
import BeatData from "../../data/sources/beat-data";
import OscData from "../../data/sources/osc-data";
import LoadEditorPlugin from "../../domain/use-cases/load-editor";

const beat = new BeatData()
const osc = new OscData()

const interfaces = new Interfaces(beat, osc)

new LoadEditorPlugin(interfaces).execute()
