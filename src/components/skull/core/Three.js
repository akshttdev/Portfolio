import * as THREE from "three/webgpu";
import WebGPUContext from "./WebGPUContext";
import Scene from "../scenes/Scene";
import MouseTrail from "../utils/MouseTrail";
import FluidSim from "../postprocessing/FluidSim";
import PostProcessing from "../postprocessing/PostProcessing";

class Three {
	constructor(container) {
		this.container = container;
		this.clock = new THREE.Clock();
		this.disposed = false;
		this.rafHandle = null;
		this.onResize = this.#onResize.bind(this);
	}

	async run() {
		this.context = new WebGPUContext(this.container);
		await this.context.init();

		this.#setup();
		this.#animate();
		this.#addResizeListener();
	}

	#setup() {
		const { width, height } = this.context.getFullScreenDimensions();
		const pr = this.context.pixelRatio;
		this.scene = new Scene();
		this.mouseTrail = new MouseTrail(width * pr, height * pr);
		this.fluidSim = new FluidSim(width * pr, height * pr);

		this.postProcessing = new PostProcessing(
			this.context.renderer,
			this.scene.solidScene,
			this.scene.wireScene,
			this.scene.camera,
			this.fluidSim.texture,
		);
	}

	#animate() {
		if (this.disposed) return;
		const delta = this.clock.getDelta();

		this.scene.animate(delta, this.clock.elapsedTime);

		// Update mouse trail → fluid sim
		this.mouseTrail.update(
			this.scene.cameraRig.mouseNormalized.x,
			this.scene.cameraRig.mouseNormalized.y,
		);
		this.fluidSim.update(this.context.renderer, this.mouseTrail.texture);

		// Render everything (scene passes + effects)
		this.postProcessing.render();

		this.rafHandle = requestAnimationFrame(() => this.#animate());
	}

	#addResizeListener() {
		window.addEventListener("resize", this.onResize);
	}

	#onResize() {
		const { width, height } = this.context.getFullScreenDimensions();
		const pr = this.context.pixelRatio;

		this.context.onResize(width, height);
		this.scene.onResize(width, height);
		this.fluidSim.onResize(width * pr, height * pr);
	}

	dispose() {
		this.disposed = true;
		if (this.rafHandle !== null) {
			cancelAnimationFrame(this.rafHandle);
			this.rafHandle = null;
		}
		window.removeEventListener("resize", this.onResize);
		if (this.context) {
			this.context.dispose();
			this.context = null;
		}
	}
}

export default Three;
