import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { loadModelBuffer } from "./modelCache";

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");
dracoLoader.preload();
loader.setDRACOLoader(dracoLoader);

export default class ImportGltf {
	constructor(url, { onLoad }) {
		// Parses the buffer the early prefetch already started, instead of downloading the model a second time
		this.ready = loadModelBuffer(url)
			.then((buffer) => loader.parseAsync(buffer, ""))
			.then((gltf) => onLoad?.(gltf.scene))
			.catch((error) => {
				console.error("GLTF load error:", error);
				throw error;
			});
	}
}
