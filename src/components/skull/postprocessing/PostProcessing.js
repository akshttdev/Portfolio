import * as THREE from "three/webgpu";
import {
	pass,
	vec3,
	vec4,
	screenUV,
	screenCoordinate,
	time,
	float,
	sub,
	sin,
	mul,
	add,
	mix,
	dot,
	clamp,
	floor,
	texture,
	fract,
	vec2,
} from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";

const BAYER_8X8 = [
	 0, 32,  8, 40,  2, 34, 10, 42,
	48, 16, 56, 24, 50, 18, 58, 26,
	12, 44,  4, 36, 14, 46,  6, 38,
	60, 28, 52, 20, 62, 30, 54, 22,
	 3, 35, 11, 43,  1, 33,  9, 41,
	51, 19, 59, 27, 49, 17, 57, 25,
	15, 47,  7, 39, 13, 45,  5, 37,
	63, 31, 55, 23, 61, 29, 53, 21,
];

function createBayerTexture() {
	const data = new Float32Array(64);
	for (let i = 0; i < 64; i++) data[i] = BAYER_8X8[i] / 64.0;
	const tex = new THREE.DataTexture(
		data,
		8,
		8,
		THREE.RedFormat,
		THREE.FloatType,
	);
	tex.wrapS = THREE.RepeatWrapping;
	tex.wrapT = THREE.RepeatWrapping;
	tex.minFilter = THREE.NearestFilter;
	tex.magFilter = THREE.NearestFilter;
	tex.needsUpdate = true;
	return tex;
}

export default class PostProcessing {
	constructor(renderer, solidScene, wireScene, camera, fluidMaskNode) {
		this.renderer = renderer;
		this.pipeline = new THREE.RenderPipeline(renderer);
		this.solidScene = solidScene;
		this.wireScene = wireScene;
		this.camera = camera;
		this.fluidMaskNode = fluidMaskNode;

		this.bayerTexture = createBayerTexture();

		this.#compose();
	}

	#compose() {
		// Render both scenes
		const solidPass = (this.solidPass = pass(this.solidScene, this.camera));
		const solidColor = solidPass.getTextureNode("output");

		const wirePass = (this.wirePass = pass(this.wireScene, this.camera));
		const wireColor = wirePass.getTextureNode("output");

		// Bloom on solid scene
		const bloomPass = bloom(solidColor.sample(screenUV), 0.4, 0.05);

		// Scan lines on bloom only (darken only)
		const scanRaw = sin(mul(screenUV.y, float(1250.0)));
		const scanDarken = clamp(scanRaw, -1.0, 0.0).mul(-0.15);
		const scanLines = sub(float(1.0), scanDarken);
		const bloomWithScanLines = bloomPass.mul(scanLines);

		// Fluid mask composites solid ↔ wire
		const fluidMask = sub(float(1.0), this.fluidMaskNode.sample(screenUV).r);
		const blended = mix(
			bloomWithScanLines,
			wireColor.sample(screenUV),
			fluidMask,
		);

		// Film grain: per-pixel hash noise, re-rolled every frame. Was MaterialX Perlin noise sampled at
		// ~1 cell per pixel, which looks the same here (±1.5%, under the dither) but is a big chunk of shader
		// code: this cut the post-processing compile on a first visit by ~250 ms.
		const seed = screenCoordinate.add(fract(time.mul(7.0)).mul(97.0));
		const noise = fract(sin(dot(seed, vec2(12.9898, 78.233))).mul(43758.5453)).sub(0.5).mul(0.015);

		// Combine effects
		const withEffects = blended.sub(noise);

		// Slight desaturation
		const luminance = dot(withEffects, vec3(0.299, 0.587, 0.114));
		const desaturated = mix(
			vec3(luminance, luminance, luminance),
			withEffects,
			float(0.985),
		);

		// The site's grade: black shadows, blood-red mids, bone-white highlights
		const level = dot(desaturated.rgb, vec3(0.299, 0.587, 0.114)); // .rgb: the colour is RGBA, alpha would count as light
		const toRed = vec3(0.86, 0.12, 0.08).mul(clamp(level.div(float(0.42)), float(0.0), float(1.0)));
		const graded = mix(toRed, vec3(0.96, 0.93, 0.9), clamp(level.sub(float(0.42)).div(float(0.58)), float(0.0), float(1.0)));
		// keep the pipeline's RGBA shape (a vec3 output leaves the canvas alpha undefined)
		const lowContrast = vec4(graded, float(1.0));

		// 8x8 ordered Bayer dither (per-channel), then blend with original scene
		const bayerNode = texture(this.bayerTexture);
		const bayerUV = screenCoordinate.div(8.0);
		const bayerValue = bayerNode.sample(bayerUV).r.sub(0.5);

		const levels = float(8.0);
		const denom = sub(levels, float(1.0));
		const dr = clamp(floor(add(lowContrast.r.mul(levels), bayerValue)).div(denom), 0.0, 1.0);
		const dg = clamp(floor(add(lowContrast.g.mul(levels), bayerValue)).div(denom), 0.0, 1.0);
		const db = clamp(floor(add(lowContrast.b.mul(levels), bayerValue)).div(denom), 0.0, 1.0);
		const ditheredColor = vec3(dr, dg, db);

		// Blend the halftone subtly with the original scene
		const finalColor = mix(lowContrast, ditheredColor, float(0.35));

		this.pipeline.outputNode = finalColor;
	}

	/**
	 * Compiles the models' shaders for both scene passes in the background (createRenderPipelineAsync).
	 * Call once the models are in the scenes. Otherwise they compile synchronously on the first frame that
	 * draws them, which stalls the GPU process and with it the whole page (preloader included) for up to a
	 * few seconds whenever the browser's shader cache is cold.
	 */
	compileAsync() {
		return Promise.all([this.solidPass.compileAsync(this.renderer), this.wirePass.compileAsync(this.renderer)]);
	}

	render() {
		this.pipeline.render();
	}

	dispose() {
		this.pipeline.dispose();
		this.bayerTexture?.dispose();
	}
}
