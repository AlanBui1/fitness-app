import { useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { cn } from "@/lib/utils";

interface PoseDetectionProps {
  videoElement: HTMLVideoElement | null;
  className?: string;
}

const PoseDetection = ({
  videoElement,
  className = "",
}: PoseDetectionProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);

  useEffect(() => {
    const initializeDetector = async () => {
      await tf.ready();
      const model = poseDetection.SupportedModels.MoveNet;
      const detector = await poseDetection.createDetector(model, {
        modelType: "lightning",
      });
      detectorRef.current = detector;
    };

    initializeDetector();

    return () => {
      if (detectorRef.current) {
        detectorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!videoElement || !canvasRef.current || !detectorRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame: number;

    const detectPose = async () => {
      if (!videoElement || !detectorRef.current || !ctx) return;

      try {
        const poses = await detectorRef.current.estimatePoses(videoElement);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw skeleton
        poses.forEach((pose) => {
          drawSkeleton(ctx, pose.keypoints);
        });
      } catch (error) {
        console.error("Error detecting pose:", error);
      }

      animationFrame = requestAnimationFrame(detectPose);
    };

    // Start detection loop
    detectPose();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [videoElement]);

  // Update canvas size when video dimensions change
  useEffect(() => {
    if (!videoElement || !canvasRef.current) return;

    const updateCanvasSize = () => {
      if (!videoElement || !canvasRef.current) return;
      canvasRef.current.width = videoElement.videoWidth;
      canvasRef.current.height = videoElement.videoHeight;
    };

    videoElement.addEventListener("loadedmetadata", updateCanvasSize);
    updateCanvasSize();

    return () => {
      videoElement.removeEventListener("loadedmetadata", updateCanvasSize);
    };
  }, [videoElement]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 z-10 pointer-events-none", className)}
    />
  );
};

// Helper function to draw skeleton
const drawSkeleton = (
  ctx: CanvasRenderingContext2D,
  keypoints: poseDetection.Keypoint[],
) => {
  // Define connections between keypoints
  const connections = [
    ["nose", "left_eye"],
    ["nose", "right_eye"],
    ["left_eye", "left_ear"],
    ["right_eye", "right_ear"],
    ["left_shoulder", "right_shoulder"],
    ["left_shoulder", "left_elbow"],
    ["right_shoulder", "right_elbow"],
    ["left_elbow", "left_wrist"],
    ["right_elbow", "right_wrist"],
    ["left_shoulder", "left_hip"],
    ["right_shoulder", "right_hip"],
    ["left_hip", "right_hip"],
    ["left_hip", "left_knee"],
    ["right_hip", "right_knee"],
    ["left_knee", "left_ankle"],
    ["right_knee", "right_ankle"],
  ];

  // Draw points
  keypoints.forEach((keypoint) => {
    if (keypoint.score && keypoint.score > 0.3) {
      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "#00ff00";
      ctx.fill();
    }
  });

  // Draw lines
  connections.forEach(([start, end]) => {
    const startPoint = keypoints.find((kp) => kp.name === start);
    const endPoint = keypoints.find((kp) => kp.name === end);

    if (
      startPoint?.score &&
      endPoint?.score &&
      startPoint.score > 0.3 &&
      endPoint.score > 0.3
    ) {
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
};

export default PoseDetection;
