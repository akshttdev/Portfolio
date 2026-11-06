import * as THREE from "three";
import { Effect } from "postprocessing";
import { wrapEffect } from "@react-three/postprocessing";
import { ditherFragmentShader } from "./shaders";

/** Post effect: pixelates the frame and applies an 8x8 ordered (Bayer) dither with `colorNum` levels. */
class RetroEffectImpl extends Effect {
  public uniforms: Map<string, THREE.Uniform<number>>;

  constructor() {
    const uniforms = new Map([
      ["colorNum", new THREE.Uniform(4.0)],
      ["pixelSize", new THREE.Uniform(2.0)],
    ]);
    super("RetroEffect", ditherFragmentShader, { uniforms });
    this.uniforms = uniforms;
  }

  set colorNum(v: number) {
    this.uniforms.get("colorNum")!.value = v;
  }
  get colorNum() {
    return this.uniforms.get("colorNum")!.value;
  }

  set pixelSize(v: number) {
    this.uniforms.get("pixelSize")!.value = v;
  }
  get pixelSize() {
    return this.uniforms.get("pixelSize")!.value;
  }
}

export const RetroEffect = wrapEffect(RetroEffectImpl);
