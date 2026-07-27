"use client";

import React, { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils } from "three";

interface AvatarProps extends React.ComponentProps<"group"> {
  isSpeaking: boolean;
  volumeLevel?: number;
}

export function Avatar({ isSpeaking, volumeLevel, ...props }: AvatarProps) {
  const group = useRef<Group>(null);
  const morphMeshes = useRef<any[]>([]);
  const spineBone = useRef<any>(null);
  const initialSpineRotX = useRef<number>(0);

  // توقيت الرمش السريع
  const nextBlinkTime = useRef<number>(0.5);
  const blinkStartTime = useRef<number>(-1);
  const blinkDuration = useRef<number>(0.12);

  const { scene } = useGLTF("/avatar.glb");

  useEffect(() => {
    morphMeshes.current = [];

    scene.traverse((node: any) => {
      const nodeName = node.name || "";
      const lowerName = nodeName.toLowerCase();

      if (lowerName.includes("watermark") || lowerName.includes("logo")) {
        node.visible = false;
      }

      if (node.isMesh && node.morphTargetDictionary) {
        morphMeshes.current.push(node);
      }

      if (node.isBone && lowerName.includes("spine")) {
        spineBone.current = node;
        initialSpineRotX.current = node.rotation.x || 0;
      }
    });
  }, [scene]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // 1. حركة تنفس خفيفة للجسم
    if (spineBone.current) {
      const breath = Math.sin(time * 1.5) * 0.005;
      spineBone.current.rotation.x = MathUtils.lerp(
        spineBone.current.rotation.x,
        initialSpineRotX.current + breath,
        0.1
      );
    }

    // 2. محرك الرمش الفائق السرعة
    let blinkTarget = 0;

    if (time > nextBlinkTime.current && blinkStartTime.current === -1) {
      blinkStartTime.current = time;
      blinkDuration.current = 0.10 + Math.random() * 0.04;
    }

    if (blinkStartTime.current !== -1) {
      const elapsed = time - blinkStartTime.current;
      const progress = elapsed / blinkDuration.current;

      if (progress >= 1) {
        blinkStartTime.current = -1;
        const isDoubleBlink = Math.random() < 0.25;
        const nextDelay = isDoubleBlink ? 0.15 : 0.8 + Math.random() * 1.4;

        nextBlinkTime.current = time + nextDelay;
        blinkTarget = 0;
      } else {
        blinkTarget = Math.sin(progress * Math.PI);
      }
    }

    // 3. محاكاة حركة كلام واقعية (تتضمن فتح الفم وإغلاقه وانطباق الشفايف بشكل متقطع)
    // بنستخدم دمج ما بين ترددات سريعة وقيم عشوائية مقيدة عشان الفم ما يفضلش ثابت مفتوح
    const speechNoise = Math.sin(time * 14) * Math.cos(time * 23);
    const dynamicOpen = isSpeaking ? Math.max(0, speechNoise) * 0.45 : 0;
    const dynamicClose = isSpeaking ? (Math.sin(time * 11) > 0.3 ? 0.5 : 0) : 0;

    morphMeshes.current.forEach((mesh) => {
      const dict = mesh.morphTargetDictionary;
      const influences = mesh.morphTargetInfluences;

      if (!dict || !influences) return;

      Object.keys(dict).forEach((key) => {
        const lowerKey = key.toLowerCase();
        const index = dict[key];

        // الرمش
        if (
          lowerKey.includes("reyeclose") ||
          lowerKey.includes("leyeclose") ||
          lowerKey.includes("blink")
        ) {
          influences[index] = blinkTarget;
        }

        // التحكم في فتح وإغلاق الفم أثناء الكلام
        if (isSpeaking) {
          if (
            lowerKey.includes("mouthopen") ||
            lowerKey.includes("ae_aa") ||
            lowerKey.includes("ao_a") ||
            lowerKey.includes("uh_oo")
          ) {
            // فتح الفم وغلقه بنمط متقطع يشبه الكلام الحقيقي
            influences[index] = MathUtils.lerp(influences[index], dynamicOpen, 0.4);
          }

          if (
            lowerKey.includes("mouthclose") ||
            lowerKey.includes("lipsclosed") ||
            lowerKey.includes("jawclose")
          ) {
            // إظهار انطباق الشفايف (حروف M, B, P) بشكل دوري أثناء الكلام
            influences[index] = MathUtils.lerp(influences[index], dynamicClose, 0.4);
          }
        } else {
          // عند السكون: تصفير كل حركات الفم تماماً وبسرعة
          if (
            lowerKey.includes("mouthopen") ||
            lowerKey.includes("ae_aa") ||
            lowerKey.includes("ao_a") ||
            lowerKey.includes("uh_oo") ||
            lowerKey.includes("mouthclose") ||
            lowerKey.includes("lipsclosed") ||
            lowerKey.includes("jawclose") ||
            lowerKey.includes("jawcompress")
          ) {
            influences[index] = MathUtils.lerp(influences[index], 0, 0.8);
            if (influences[index] < 0.01) influences[index] = 0;
          }
        }
      });
    });
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} scale={1.9} position={[0, -1.65, 0]} />
    </group>
  );
}

useGLTF.preload("/avatar.glb");