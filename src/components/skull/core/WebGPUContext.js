import * as THREE from "three/webgpu";

// The scene renders two full scenes plus bloom/fluid-sim/grain/dither passes
// every frame — cost scales with pixel count. On a 4K/large display that's
// 4x+ the fragment-shader work of 1080p for no visible benefit at hero-blur
// distances, and was measured to make the scene noticeably laggy. Cap the
// internal render resolution and let the canvas (already 100% width/height)
// upscale it — the softness is imperceptible against the film-grain/dither
// look, but the GPU cost stays flat above this budget.
const MAX_RENDER_PIXELS = 1920 * 1080;

class WebGPUContext {
	constructor(container) {
		if (!!WebGPUContext.instance) {
			return WebGPUContext.instance;
		}

		this.container = container;
		this.renderer = null;
		this.canvas = null;
		this.pixelRatio = Math.min(window.devicePixelRatio, 1.0);

		WebGPUContext.instance = this;
	}

	async init() {
		this.canvas = this.#createCanvas();
		this.renderer = new THREE.WebGPURenderer({
			canvas: this.canvas,
			antialias: false,
		});

		await this.renderer.init();

		const { width, height } = this.getFullScreenDimensions();
		const { renderWidth, renderHeight } = this.#computeRenderSize(width, height);
		this.renderer.setPixelRatio(this.pixelRatio);
		this.renderer.setSize(renderWidth, renderHeight, false);
		this.renderer.shadowMap.enabled = false;
		this.renderer.autoClear = false;
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
	}

	getFullScreenDimensions() {
		const rect = this.container?.getBoundingClientRect();
		const width = rect?.width || window.innerWidth;
		const height = rect?.height || window.innerHeight;
		return { width, height };
	}

	#computeRenderSize(width, height) {
		const pixels = width * height;
		const scale = pixels > MAX_RENDER_PIXELS ? Math.sqrt(MAX_RENDER_PIXELS / pixels) : 1;
		return {
			renderWidth: Math.round(width * scale),
			renderHeight: Math.round(height * scale),
		};
	}

	#createCanvas() {
		const canvas = document.createElement("canvas");
		canvas.style.position = "absolute";
		canvas.style.left = "0";
		canvas.style.top = "0";
		canvas.style.width = "100%";
		canvas.style.height = "100%";
		canvas.style.pointerEvents = "auto";
		this.container.appendChild(canvas);
		return canvas;
	}

	onResize(width, height) {
		this.pixelRatio = Math.min(window.devicePixelRatio, 1.0);
		const { renderWidth, renderHeight } = this.#computeRenderSize(width, height);
		this.renderer.setPixelRatio(this.pixelRatio);
		this.renderer.setSize(renderWidth, renderHeight, false);
	}

	dispose() {
		if (this.renderer) {
			this.renderer.dispose();
			this.renderer = null;
		}
		if (this.canvas && this.canvas.parentNode) {
			this.canvas.parentNode.removeChild(this.canvas);
		}
		this.canvas = null;
		this.container = null;
		WebGPUContext.instance = null;
	}
}

export default WebGPUContext;
