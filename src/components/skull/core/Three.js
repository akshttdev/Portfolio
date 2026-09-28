import * as THREE from "three/webgpu";
import WebGPUContext from "./WebGPUContext";
import Scene from "../scenes/Scene";
import MouseTrail from "../utils/MouseTrail";
import FluidSim from "../postprocessing/FluidSim";
import PostProcessing from "../postprocessing/PostProcessing";

// Fluid sim / mouse trail are soft, blurred effects — rendering them at full
// resolution is wasted cost (especially on 4K/high-DPI screens). Half res is
// visually indistinguishable once sampled through the bloom/composite pass.
const SIM_SCALE = 0.5;

class Three {
	constructor(container) {
		this.container = container;
		this.clock = new THREE.Clock();
		this.disposed = false;
		this.rafHandle = null;
		this.visible = true;
		this.onResize = this.#onResize.bind(this);
		this.onVisibilityChange = this.#onVisibilityChange.bind(this);
	}

	async run() {
		this.context = new WebGPUContext(this.container);
		await this.context.init();

		this.#setup();
		this.#addVisibilityHandling();
		this.#animate();
		this.#addResizeListener();
	}

	#setup() {
		const { width, height } = this.context.getFullScreenDimensions();
		const pr = this.context.pixelRatio;
		this.scene = new Scene();
		this.mouseTrail = new MouseTrail(width * pr * SIM_SCALE, height * pr * SIM_SCALE);
		this.fluidSim = new FluidSim(width * pr * SIM_SCALE, height * pr * SIM_SCALE);

		this.postProcessing = new PostProcessing(
			this.context.renderer,
			this.scene.solidScene,
			this.scene.wireScene,
			this.scene.camera,
			this.fluidSim.texture,
		);
	}

	// The scene sits in a tall single-page layout — once the user scrolls past
	// it (or switches tabs), it would otherwise keep rendering forever in the
	// background, burning GPU/CPU and making the rest of the page feel laggy.
	#addVisibilityHandling() {
		this.io = new IntersectionObserver(
			([entry]) => {
				this.visible = entry.isIntersecting && document.visibilityState === "visible";
				if (this.visible && this.rafHandle === null && !this.disposed) {
					this.#animate();
				}
			},
			{ threshold: 0 },
		);
		this.io.observe(this.container);
		document.addEventListener("visibilitychange", this.onVisibilityChange);
	}

	#onVisibilityChange() {
		if (document.visibilityState === "visible") {
			this.#refreshVisibility();
			return;
		}
		this.visible = false;
	}

	#refreshVisibility() {
		if (!this.io) return;
		const rect = this.container.getBoundingClientRect();
		const inViewport = rect.bottom > 0 && rect.top < window.innerHeight;
		this.visible = inViewport && document.visibilityState === "visible";
		if (this.visible && this.rafHandle === null && !this.disposed) {
			this.#animate();
		}
	}

	#animate() {
		if (this.disposed) return;
		if (!this.visible) {
			// Stop the loop entirely; the IntersectionObserver/visibilitychange
			// handlers above restart it once the scene is visible again.
			this.rafHandle = null;
			return;
		}

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
		this.fluidSim.onResize(width * pr * SIM_SCALE, height * pr * SIM_SCALE);
	}

	dispose() {
		this.disposed = true;
		if (this.rafHandle !== null) {
			cancelAnimationFrame(this.rafHandle);
			this.rafHandle = null;
		}
		window.removeEventListener("resize", this.onResize);
		document.removeEventListener("visibilitychange", this.onVisibilityChange);
		this.io?.disconnect();
		this.io = null;
		if (this.context) {
			this.context.dispose();
			this.context = null;
		}
	}
}

export default Three;
