"use client";

import dynamic from "next/dynamic";

const ShaderBackgroundInner = dynamic(
  () => import("./ShaderBackgroundInner"),
  { ssr: false, loading: () => null }
);

export default function ShaderBackground() {
  return <ShaderBackgroundInner />;
}
