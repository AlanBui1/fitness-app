import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WebcamFeedProps {
  isEnabled?: boolean;
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: Error) => void;
  className?: string;
}

const WebcamFeed = ({
  isEnabled = true,
  onStreamReady = () => {},
  onError = () => {},
  className = "",
}: WebcamFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeWebcam = async () => {
      if (!isEnabled) {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }
        return;
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        });

        if (!mounted) return;

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        setStream(mediaStream);
        setError(null);
        onStreamReady(mediaStream);
      } catch (err) {
        if (!mounted) return;
        const error =
          err instanceof Error ? err : new Error("Failed to access webcam");
        setError(error);
        onError(error);
      }
    };

    initializeWebcam();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isEnabled, onStreamReady, onError]);

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 text-center p-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <CameraOff className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry Camera
          </Button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!stream && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/95">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Camera className="w-8 h-8 text-primary" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WebcamFeed;
