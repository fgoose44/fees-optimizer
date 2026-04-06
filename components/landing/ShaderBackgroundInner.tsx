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
        brightness={1}
        cAzimuthAngle={201}
        cDistance={14}
        cPolarAngle={76}
        cameraZoom={5}
        color1="#95CCFF"
        color2="#106BA3"
        color3="#FFB3AC"
        destination="onCanvas"
        embedMode="off"
        envPreset="city"
        format="gif"
        fov={10}
        frameRate={10}
        gizmoHelper="hide"
        grain="off"
        lightType="3d"
        pixelDensity={1.7}
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
        uDensity={1}
        uFrequency={5.5}
        uSpeed={0.2}
        uStrength={3.5}
        zoomOut={true}
        uTime={0}
        wireframe={false}
      />
    </ShaderGradientCanvas>
  );
}
