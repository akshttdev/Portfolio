import * as THREE from "three";

export default class MouseTrail {
	constructor(width, height) {
		this.currentX = null;
		this.currentY = null;
		this.lastX = null;
		this.lastY = null;
		this.opacity = 0;
		this.lerpSpeed = 0.075;
		this.fadeInSpeed = 0.1;
		this.fadeOutSpeed = 0.1;
		this.moveThreshold = 0.5;

		this.#createCanvas(width, height);
		this.#createTexture();
	}

	#createCanvas(width, height) {
		this.canvas = document.createElement("canvas");
		this.canvas.width = width;
		this.canvas.height = height;
		this.ctx = this.canvas.getContext("2d");
		this.lineWidth = Math.max(width * 0.2, 100);

		this.ctx.fillStyle = "white";
		this.ctx.fillRect(0, 0, width, height);
	}

	#createTexture() {
		this.texture = new THREE.CanvasTexture(this.canvas);
		this.texture.minFilter = THREE.LinearFilter;
		this.texture.magFilter = THREE.LinearFilter;
		this.texture.generateMipmaps = false;
	}

	update(mouseX, mouseY) {
		const targetX = mouseX * this.canvas.width;
		const targetY = (1 - mouseY) * this.canvas.height;

		if (this.currentX === null) {
			this.currentX = targetX;
			this.currentY = targetY;
			this.lastX = targetX;
			this.lastY = targetY;
			return;
		}

		this.#lerp(targetX, targetY);
		this.#updateOpacity();

		// Once the trail has faded out and the canvas is plain white, there is nothing new to draw:
		// skip the 2D redraw and the per-frame CPU→GPU texture upload until the mouse moves again.
		const idle = this.opacity <= 0.01;
		if (!(idle && this.isBlank)) {
			this.#draw();
			this.isBlank = idle;
			this.texture.needsUpdate = true;
		}

		this.lastX = this.currentX;
		this.lastY = this.currentY;
	}

	#lerp(targetX, targetY) {
		this.currentX += (targetX - this.currentX) * this.lerpSpeed;
		this.currentY += (targetY - this.currentY) * this.lerpSpeed;
	}

	#updateOpacity() {
		const dx = this.currentX - this.lastX;
		const dy = this.currentY - this.lastY;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist > this.moveThreshold) {
			this.opacity = Math.min(1, this.opacity + this.fadeInSpeed);
		} else {
			this.opacity = Math.max(0, this.opacity - this.fadeOutSpeed);
		}
	}

	#draw() {
		const { canvas, ctx, lineWidth } = this;

		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		if (this.opacity > 0.01) {
			ctx.beginPath();
			ctx.moveTo(this.lastX, this.lastY);
			ctx.lineTo(this.currentX, this.currentY);
			ctx.lineCap = "round";
			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = `rgba(0, 0, 0, ${this.opacity})`;
			ctx.stroke();
		}
	}

	dispose() {
		this.texture.dispose();
	}
}
