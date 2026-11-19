import * as THREE from "three/webgpu";
import WebGPUContext from "./WebGPUContext";
import Scene from "../scenes/Scene";
import MouseTrail from "../utils/MouseTrail";
import FluidSim from "../postprocessing/FluidSim";
import PostProcessing from "../postprocessing/PostProcessing";

// Fluid sim / mouse trail are soft, blurred effects, so rendering them at full
// resolution is wasted cost (especially on 4K/high-DPI screens). Half res is
// visually indistinguishable once sampled through the bloom/composite pass.
const SIM_SCALE = 0.5;

class Three {
	constructor(container) {
		this.container = container;
		this.clock = new THREE.Clock();
		// the scene's own time: advances only while it renders, so it carries on smoothly after a pause
		// (scrolled away, other tab) instead of jumping ahead by the time it was paused
		this.time = 0;
		this.size = { width: 0, height: 0 };
		this.resizeTimer = null;
		this.disposed = false;
		this.rafHandle = null;
		this.visible = true;
		this.onResize = this.#onResize.bind(this);
		this.onVisibilityChange = this.#onVisibilityChange.bind(this);
		this.tick = () => this.#animate();
	}

	/**
	 * Resolves once the models are loaded and the first full frame is done.
	 * `onProgress` (0..1) drives the preloader's count.
	 *
	 * On a first visit (cold shader cache) the GPU spends ~3 s compiling shaders: ~1 s starting WebGPU,
	 * ~0.6 s for the environment map, ~1.2 s for bloom + grain + dither. Those compiles are synchronous
	 * and stall the whole tab, so they all happen here, under the preloader, never after the hero is shown.
	 */
	async run(onProgress) {
		this.context = new WebGPUContext(this.container);
		await this.context.init();
		if (this.disposed) return; // unmounted while WebGPU was starting
		onProgress?.(0.45);

		this.#setup();
		// One frame of the still-empty scenes while the models download: builds the post-processing passes
		// (bloom, fluid sim, grain) under the preloader, overlapping the network wait. The loop itself doesn't
		// start yet; rendering an empty scene every frame only competed with the preloader for the GPU.
		this.#render(0, 0);
		onProgress?.(0.6);

		await this.scene.ready;
		if (this.disposed) return;
		onProgress?.(0.75);
		// The models' shaders compile in the background (async pipelines), so the first frame that draws them
		// has nothing left to compile.
		await this.postProcessing.compileAsync();
		if (this.disposed) return;
		onProgress?.(0.9);

		this.#addVisibilityHandling();
		const start = this.context.getFullScreenDimensions();
		this.size = { width: Math.round(start.width), height: Math.round(start.height) };
		this.#addResizeListener();
		this.clock.getDelta(); // don't count the loading time as one long first frame
		this.#animate();
		// Let the GPU finish that first frame, so the preloader leaves onto a finished hero
		await this.context.renderer.backend.device?.queue.onSubmittedWorkDone();
	}

	#setup() {
		const { width, height } = this.context.getFullScreenDimensions();
		const pr = this.context.pixelRatio;
		this.scene = new Scene(this.context);
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

	// The scene sits in a tall single-page layout. Once the user scrolls past
	// it (or switches tabs), it would otherwise keep rendering forever in the
	// background, burning GPU/CPU and making the rest of the page feel laggy.
	#addVisibilityHandling() {
		this.io = new IntersectionObserver(
			([entry]) => {
				this.visible = entry.isIntersecting && document.visibilityState === "visible";
				if (this.visible && this.rafHandle === null && !this.disposed) {
					this.clock.getDelta(); // don't count the paused time
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
			this.clock.getDelta(); // don't count the paused time
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

		// Render every frame, scrolling or not. (It used to skip frames while the page scrolled, which froze
		// the skull mid-scroll and then made it jump.) The render size cap in WebGPUContext keeps this cheap.
		const delta = Math.min(this.clock.getDelta(), 1 / 30);
		this.time += delta;
		this.#render(delta, this.time);

		this.rafHandle = requestAnimationFrame(this.tick);
	}

	#render(delta, elapsed) {
		this.scene.animate(delta, elapsed);

		// Update mouse trail → fluid sim
		this.mouseTrail.update(
			this.scene.cameraRig.mouseNormalized.x,
			this.scene.cameraRig.mouseNormalized.y,
		);
		this.fluidSim.update(this.context.renderer, this.mouseTrail.texture);

		// Render everything (scene passes + effects)
		this.postProcessing.render();
	}

	#addResizeListener() {
		window.addEventListener("resize", this.onResize);
	}

	// Debounced, and only when the hero's size really changed: on phones the address bar showing/hiding fires
	// resize events all through a scroll, and re-sizing the canvas clears it (the flashes / broken frames).
	#onResize() {
		clearTimeout(this.resizeTimer);
		this.resizeTimer = setTimeout(() => this.#applyResize(), 150);
	}

	#applyResize() {
		if (this.disposed || !this.context) return;
		const { width, height } = this.context.getFullScreenDimensions();
		if (Math.round(width) === this.size.width && Math.round(height) === this.size.height) return;
		this.size = { width: Math.round(width), height: Math.round(height) };
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
		clearTimeout(this.resizeTimer);
		document.removeEventListener("visibilitychange", this.onVisibilityChange);
		this.io?.disconnect();
		this.io = null;
		// Free GPU memory: without this every visit to the home page left the previous scene allocated
		this.postProcessing?.dispose();
		this.fluidSim?.dispose();
		this.mouseTrail?.dispose();
		this.scene?.dispose();
		if (this.context) {
			this.context.dispose();
			this.context = null;
		}
	}
}

export default Three;
