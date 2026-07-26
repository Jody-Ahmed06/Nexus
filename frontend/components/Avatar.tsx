"use client";

import React, { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils } from "three";

interface AvatarProps extends React.ComponentProps<"group"> {
  isSpeaking: boolean;
}

export function Avatar({ isSpeaking, ...props }: AvatarProps) {
  const group = useRef<Group>(null);
  const morphMeshes = useRef<any[]>([]);
  const spineBone = useRef<any>(null);
  const initialSpineRotX = useRef<number>(0);

  const nextBlinkTime = useRef<number>(2);
  const isBlinking = useRef<boolean>(false);

  const { scene } = useGLTF("/avatar.glb");

  useEffect(() => {
    morphMeshes.current = [];

    scene.traverse((node: any) => {
      const nodeName = node.name || "";
      const lowerName = nodeName.toLowerCase();

      if (lowerName.includes("watermark") || lowerName.includes("logo")) {
        node.visible = false;
      }

      // التقاط مجسمات الوجه والعيون
      if (node.isMesh && node.morphTargetDictionary) {
        morphMeshes.current.push(node);
      }

      // التقاط عظمة العمود الفقري لحركة التنفس الخفيفة
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

    // 2. توقيت رمش العين (مظبوط عشان يرمش بانتظام وبنعومة)
    if (time > nextBlinkTime.current) {
      isBlinking.current = true;
      if (time > nextBlinkTime.current + 0.15) {
        isBlinking.current = false;
        nextBlinkTime.current = time + Math.random() * 3 + 2;
      }
    }
    const blinkTarget = isBlinking.current ? 1 : 0;

    // 3. التطبيق الفوري على الوجه والرمش والكلام
    morphMeshes.current.forEach((mesh) => {
      const dict = mesh.morphTargetDictionary;
      const influences = mesh.morphTargetInfluences;

      if (!dict || !influences) return;

      Object.keys(dict).forEach((key) => {
        const lowerKey = key.toLowerCase();
        const index = dict[key];

        // الرمش الناعم
        if (
          lowerKey.includes("blink") ||
          lowerKey.includes("eye_close") ||
          lowerKey.includes("eyes_closed") ||
          lowerKey.includes("eyelid")
        ) {
          if (!lowerKey.includes("up") && !lowerKey.includes("wide")) {
            influences[index] = MathUtils.lerp(influences[index], blinkTarget, 0.4);
          }
        }

        // حركة الكلام الحية والمتزامنة فوراً مع الصوت
        if (isSpeaking) {
          if (
            lowerKey.includes("jawopen") ||
            lowerKey.includes("mouthopen") ||
            lowerKey.includes("ae_aa") ||
            lowerKey.includes("ao_a") ||
            lowerKey.includes("uh_oo")
          ) {
            const wave = (Math.sin(time * 18) * 0.5 + 0.5) * 0.2;
            influences[index] = MathUtils.lerp(influences[index], wave, 0.8);
          }
        } else {
          // إغلاق الفم فوراً عند انتهاء الكلام
          if (
            lowerKey.includes("jaw") ||
            lowerKey.includes("mouth") ||
            lowerKey.includes("h_expressions") ||
            lowerKey.includes("ae_aa") ||
            lowerKey.includes("ao_a")
          ) {
            influences[index] = MathUtils.lerp(influences[index], 0, 0.8);
          }
        }
      });
    });
  });

  return (
    <group ref={group} {...props} dispose={null}>
      {/* رفع الأفاتار قليلاً ليتموضع في منتصف الإطار البيضاوي بدقة */}
      <primitive object={scene} scale={1.9} position={[0, -1.65, 0]} />
    </group>
  );
}

useGLTF.preload("/avatar.glb");