"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { waveFragmentShader, waveVertexShader } from "./shaders";
import { RetroEffect } from "./RetroEffect";

type WaveProps = {
  waveSpeed: number;
  waveFrequency: number;
  waveAmplitude: number;
  waveColor: [number, number, number];
  colorNum: number;
  pixelSize: number;
  disableAnimation: boolean;
  enableMouseInteraction: boolean;
  mouseRadius: number;
};

function DitheredWaves(props: WaveProps) {
  const { waveSpeed, waveFrequency, waveAmplitude, waveColor, colorNum, pixelSize } = props;
  const { disableAnimation, enableMouseInteraction, mouseRadius } = props;
  const mouse = useRef(new THREE.Vector2());
  const { viewport, size, gl } = useThree();

  const uniforms = useRef({
    time: new THREE.Uniform(0),
    resolution: new THREE.Uniform(new THREE.Vector2(0, 0)),
    waveSpeed: new THREE.Uniform(waveSpeed),
    waveFrequency: new THREE.Uniform(waveFrequency),
    waveAmplitude: new THREE.Uniform(waveAmplitude),
    waveColor: new THREE.Uniform(new THREE.Color(...waveColor)),
    mousePos: new THREE.Uniform(new THREE.Vector2(0, 0)),
    enableMouseInteraction: new THREE.Uniform(enableMouseInteraction ? 1 : 0),
    mouseRadius: new THREE.Uniform(mouseRadius),
  });

  // Listen on the window: the canvas sits under the page content and never receives pointer events itself
  useEffect(() => {
    if (!enableMouseInteraction) return;
    const onMove = (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const dpr = gl.getPixelRatio();
      mouse.current.set((e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enableMouseInteraction, gl]);

  useEffect(() => {
    const dpr = gl.getPixelRatio();
    uniforms.current.resolution.value.set(size.width * dpr, size.height * dpr);
  }, [size, gl]);

  useFrame(({ clock }) => {
    const u = uniforms.current;
    if (!disableAnimation) u.time.value = clock.getElapsedTime();
    u.waveSpeed.value = waveSpeed;
    u.waveFrequency.value = waveFrequency;
    u.waveAmplitude.value = waveAmplitude;
    u.waveColor.value.set(...waveColor);
    if (enableMouseInteraction) u.mousePos.value.copy(mouse.current);
    u.enableMouseInteraction.value = enableMouseInteraction ? 1 : 0;
    u.mouseRadius.value = mouseRadius;
  });

  return (
    <>
      <mesh scale={[viewport.width, viewport.height, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial vertexShader={waveVertexShader} fragmentShader={waveFragmentShader} uniforms={uniforms.current} />
      </mesh>

      {/* One full-screen quad has no edges to smooth: MSAA (8x by default) would be pure GPU cost */}
      <EffectComposer multisampling={0}>
        <RetroEffect colorNum={colorNum} pixelSize={pixelSize} />
      </EffectComposer>
    </>
  );
}

/** Animated fbm waves, pixelated and ordered-dithered. */
export default function Dither({
  waveSpeed = 0.05,
  waveFrequency = 3,
  waveAmplitude = 0.3,
  waveColor = [0.5, 0.5, 0.5],
  colorNum = 4,
  pixelSize = 2,
  disableAnimation = false,
  enableMouseInteraction = true,
  mouseRadius = 0.3,
}: Partial<WaveProps>) {
  return (
    <Canvas className="w-full h-full pointer-events-auto" camera={{ position: [0, 0, 6] }} dpr={1} gl={{ antialias: false }}>
      <DitheredWaves
        waveSpeed={waveSpeed}
        waveFrequency={waveFrequency}
        waveAmplitude={waveAmplitude}
        waveColor={waveColor}
        colorNum={colorNum}
        pixelSize={pixelSize}
        disableAnimation={disableAnimation}
        enableMouseInteraction={enableMouseInteraction}
        mouseRadius={mouseRadius}
      />
    </Canvas>
  );
}
