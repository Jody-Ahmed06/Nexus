/**
 * useEyeTracker — MediaPipe FaceLandmarker-based eye contact tracker.
 *
 * Loads the FaceLandmarker model (~7 MB) from the MediaPipe CDN lazily.
 * Runs a requestAnimationFrame detection loop on a provided <video> element.
 * Calculates a running eye-contact percentage using iris landmark heuristics.
 */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useInterviewStore } from "../store/interviewStore";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface UseEyeTrackerReturn {
  /** 0–100 percentage of frames where the user was looking at the camera */
  eyeContactPercent: number;
  /** Whether the tracker is actively running */
  isTracking: boolean;
  /** Start tracking against the given <video> element */
  startTracking: (videoEl: HTMLVideoElement) => Promise<void>;
  /** Stop tracking and freeze the final percentage */
  stopTracking: () => void;
  /** Signals that the WASM model is still loading */
  isModelLoading: boolean;
}

// ─── Eye Contact Heuristic ─────────────────────────────────────────────────
//
// MediaPipe FaceLandmarker returns 478 landmarks.
// Iris landmarks: Left iris center ≈ 468, Right iris center ≈ 473.
// Eye corner landmarks: Left outer ≈ 33, Left inner ≈ 133, Right inner ≈ 362, Right outer ≈ 263.
//
// A simple "looking at camera" heuristic:
//   For each eye, compute where the iris is relative to the eye width.
//   If both ratios are within [0.35, 0.65] (centred), the user is looking forward.

const LEFT_IRIS = 468;
const RIGHT_IRIS = 473;
const LEFT_EYE_OUTER = 33;
const LEFT_EYE_INNER = 133;
const RIGHT_EYE_OUTER = 263;
const RIGHT_EYE_INNER = 362;

function isLookingAtCamera(landmarks: { x: number; y: number; z: number }[]): boolean {
  if (landmarks.length < 478) return false;

  try {
    const leftIris = landmarks[LEFT_IRIS];
    const leftOuter = landmarks[LEFT_EYE_OUTER];
    const leftInner = landmarks[LEFT_EYE_INNER];

    const rightIris = landmarks[RIGHT_IRIS];
    const rightOuter = landmarks[RIGHT_EYE_OUTER];
    const rightInner = landmarks[RIGHT_EYE_INNER];

    // Robust bounding box: Find exact Min and Max X for each eye to ignore mirroring flip
    const leftEyeMinX = Math.min(leftOuter.x, leftInner.x);
    const leftEyeMaxX = Math.max(leftOuter.x, leftInner.x);
    const leftEyeWidth = leftEyeMaxX - leftEyeMinX;

    const rightEyeMinX = Math.min(rightOuter.x, rightInner.x);
    const rightEyeMaxX = Math.max(rightOuter.x, rightInner.x);
    const rightEyeWidth = rightEyeMaxX - rightEyeMinX;

    // Fail immediately if eyes are closed, blinking, or lost
    if (leftEyeWidth < 0.005 || rightEyeWidth < 0.005) {
      return false;
    }

    // Calculate how far the iris is inside the eye bounding box (0.0 to 1.0)
    const leftRatio = (leftIris.x - leftEyeMinX) / leftEyeWidth;
    const rightRatio = (rightIris.x - rightEyeMinX) / rightEyeWidth;

    console.log(
      "RAW VALUES - Iris X:", leftIris?.x,
      "Inner X:", leftInner?.x,
      "Outer X:", leftOuter?.x,
      "Calculated Ratio:", leftRatio
    );

    // Penalty for head rotation (Yaw): if one eye appears significantly smaller than the other due to foreshortening
    const widthRatio = Math.max(leftEyeWidth, rightEyeWidth) / Math.min(leftEyeWidth, rightEyeWidth);
    if (widthRatio > 1.6) {
      return false; 
    }

    // Highly forgiving threshold (20% to 80%) to allow for natural movement, lighting, and camera angle
    return (
      leftRatio >= 0.2 &&
      leftRatio <= 0.8 &&
      rightRatio >= 0.2 &&
      rightRatio <= 0.8
    );
  } catch {
    return false;
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useEyeTracker(): UseEyeTrackerReturn {
  const [eyeContactPercent, setEyeContactPercentLocal] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);

  const setGlobalEyeContactPercent = useInterviewStore((state) => state.setEyeContactPercent);

  const setEyeContactPercent = useCallback((pct: number) => {
    setEyeContactPercentLocal(pct);
    setGlobalEyeContactPercent(pct);
  }, [setGlobalEyeContactPercent]);

  const faceLandmarkerRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const isTrackingRef = useRef(false);

  // Running stats
  const totalFrames = useRef(0);
  const contactFrames = useRef(0);

  const stopTracking = useCallback(() => {
    isTrackingRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsTracking(false);
  }, []);

  const startTracking = useCallback(async (videoEl: HTMLVideoElement) => {
    setIsModelLoading(true);

    try {
      // Dynamically import to avoid SSR issues
      const vision = await import("@mediapipe/tasks-vision");
      const { FaceLandmarker, FilesetResolver } = vision;

      let filesetResolver;
      try {
        filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
      } catch (cdnErr) {
        console.warn("[useEyeTracker] jsdelivr failed, trying unpkg...", cdnErr);
        filesetResolver = await FilesetResolver.forVisionTasks(
          "https://unpkg.com/@mediapipe/tasks-vision@latest/wasm"
        );
      }

      try {
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false,
          }
        );
      } catch (gpuErr) {
        console.warn("[useEyeTracker] GPU delegate failed, trying CPU...", gpuErr);
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false,
          }
        );
      }
    } catch (err) {
      console.error("[useEyeTracker] Failed to load FaceLandmarker entirely:", err);
      setIsModelLoading(false);
      // Abort tracking on total failure without mocking
      setEyeContactPercent(0);
      setIsTracking(false);
      return;
    }

    setIsModelLoading(false);

    // Reset counters
    totalFrames.current = 0;
    contactFrames.current = 0;
    isTrackingRef.current = true;
    setIsTracking(true);

    let lastTimestamp = -1;

    const detectFrame = () => {
      if (!isTrackingRef.current) return;

      if (videoEl.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
        const nowInMs = performance.now();
        
        // MediaPipe requires strictly monotonically increasing timestamps
        if (lastTimestamp !== -1 && nowInMs <= lastTimestamp) {
          rafRef.current = requestAnimationFrame(detectFrame);
          return;
        }
        lastTimestamp = nowInMs;
        
        // Ensure totalFrames increases on every valid video frame, BEFORE detection checks
        totalFrames.current++;

        try {
          const result = faceLandmarkerRef.current?.detectForVideo(
            videoEl,
            nowInMs
          );

          if (result?.faceLandmarks && result.faceLandmarks.length > 0) {
            if (isLookingAtCamera(result.faceLandmarks[0])) {
              contactFrames.current++;
            }
          }
        } catch {
          // Silently skip frames where detection errors occur
        }
        
        // Calculate dynamic score, automatically dropping if face/eyes are missing
        const pct = Math.round(
          (contactFrames.current / totalFrames.current) * 100
        );
        setEyeContactPercent(pct);
      }

      rafRef.current = requestAnimationFrame(detectFrame);
    };

    rafRef.current = requestAnimationFrame(detectFrame);
  }, [setEyeContactPercent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
      faceLandmarkerRef.current?.close?.();
    };
  }, [stopTracking]);

  return { eyeContactPercent, isTracking, startTracking, stopTracking, isModelLoading };
}
