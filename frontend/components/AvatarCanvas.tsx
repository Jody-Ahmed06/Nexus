"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows, OrbitControls } from "@react-three/drei";
import { Avatar } from "./Avatar";

interface AvatarCanvasProps {
  isSpeaking?: boolean;
}

export function AvatarCanvas({ isSpeaking = false }: AvatarCanvasProps) {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden" }}>
      <Canvas
        // الكاميرا اتأخرت لورا شوية عشان الشعر والراس يبانوا كاملين
        camera={{ position: [0, 1.4, 1.6], fov: 40 }}
        style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[-5, 5, 5]} intensity={1.5} />
        <directionalLight position={[5, 5, -5]} intensity={0.5} />
        <Environment preset="city" />

        <Suspense fallback={null}>
          <Avatar isSpeaking={isSpeaking} />
          <ContactShadows position={[0, -1.4, 0]} blur={2} far={4} opacity={0.4} scale={4} />
        </Suspense>

        <OrbitControls enablePan={false} enableRotate={false} enableZoom={false} target={[0, 1.35, 0]} />
      </Canvas>
    </div>
  );
}