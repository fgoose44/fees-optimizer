/* eslint-disable */
// @ts-nocheck
"use client";

import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

export default function ShaderBackgroundInner() {
  return (
    <ShaderGradientCanvas
      style={{ width: "100%", height: "100%" }}
    >
      <ShaderGradient
        animate="on"
        axesHelper="off"
        brightness={1.2}
        cAzimuthAngle={180}
        cDistance={5.9}
        cPolarAngle={90}
        cameraZoom={1}
        color1="#F8F9FA"
        color2="#106BA3"
        color3="#D32F2F"
        destination="onCanvas"
        embedMode="off"
        envPreset="city"
        format="gif"
        fov={40}
        frameRate={10}
        gizmoHelper="hide"
        grain="off"
        lightType="3d"
        pixelDensity={0.9}
        positionX={-1.4}
        positionY={0}
        positionZ={0}
        range="disabled"
        rangeEnd={40}
        rangeStart={0}
        reflection={0.1}
        rotationX={0}
        rotationY={10}
        rotationZ={50}
        shader="defaults"
        type="plane"
        uAmplitude={1}
        uDensity={0.8}
        uFrequency={5.5}
        uSpeed={0.2}
        uStrength={1}
        uTime={0}
        wireframe={false}
      />
    </ShaderGradientCanvas>
  );
}
