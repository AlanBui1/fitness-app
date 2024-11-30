import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RotateCcw, RefreshCw, Loader2 } from "lucide-react";
import InstructorVideo from "./InstructorVideo";
import WebcamFeed from "./WebcamFeed";
import AlignmentGrid from "./AlignmentGrid";
import VideoControls from "./VideoControls";
import LayoutToggle from "./LayoutToggle";
import GridToggle from "./GridToggle";

interface VideoContainerProps {
  className?: string;
  isCameraEnabled?: boolean;
  videoUrl?: string;
}

const VideoContainer = ({
  className = "",
  isCameraEnabled = false,
  videoUrl,
}: VideoContainerProps) => {
  const [layout, setLayout] = useState<"split" | "mini">("split");
  const [showGrid, setShowGrid] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoError, setVideoError] = useState<Error | null>(null);
  const [webcamError, setWebcamError] = useState<Error | null>(null);
  const [isEnded, setIsEnded] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isWebcamLoading, setIsWebcamLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize WebcamFeed components separately for split and mini views
  const splitWebcamFeed = useMemo(
    () => (
      <WebcamFeed
        isEnabled={isCameraEnabled && layout === "split"}
        className="w-full h-full"
        onError={setWebcamError}
        onStreamReady={() => setIsWebcamLoading(false)}
      />
    ),
    [isCameraEnabled, layout],
  );

  const miniWebcamFeed = useMemo(
    () => (
      <WebcamFeed
        isEnabled={isCameraEnabled && layout === "mini"}
        className="w-full h-full"
        onError={setWebcamError}
        onStreamReady={() => setIsWebcamLoading(false)}
      />
    ),
    [isCameraEnabled, layout],
  );

  const handlePlayPause = useCallback(() => {
    if (videoRef.current && !videoError && !isVideoLoading) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        if (isEnded) {
          handleReset();
        }
        videoRef.current.play().catch((error) => {
          setVideoError(new Error("Failed to play video: " + error.message));
          setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, videoError, isVideoLoading, isEnded]);

  const handleReset = useCallback(() => {
    if (videoRef.current && !videoError) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      videoRef.current.pause();
      setIsPlaying(false);
      setIsEnded(false);
    }
  }, [videoError]);

  const handleSeek = useCallback(
    (value: number[]) => {
      if (videoRef.current && !videoError) {
        const newTime = value[0];
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
        if (newTime < duration) {
          setIsEnded(false);
        }
      }
    },
    [videoError, duration],
  );

  const handleSeekRelative = useCallback(
    (seconds: number) => {
      if (videoRef.current && !videoError) {
        const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
        handleSeek([newTime]);
      }
    },
    [videoError, duration, currentTime, handleSeek],
  );

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleDurationChange = useCallback((newDuration: number) => {
    setDuration(newDuration);
  }, []);

  const handleVideoError = useCallback((error: Error) => {
    setVideoError(error);
    setIsPlaying(false);
    setIsEnded(false);
    setIsVideoLoading(false);
  }, []);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    setIsEnded(true);
  }, []);

  const handleRetryVideo = useCallback(() => {
    setVideoError(null);
    setIsVideoLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, []);

  const handleVideoLoaded = useCallback(() => {
    setIsVideoLoading(false);
  }, []);

  // Fullscreen handling
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  }, []);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events if the container is focused
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSeekRelative(-5); // Seek 5 seconds backward
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSeekRelative(5); // Seek 5 seconds forward
          break;
        case "Home":
          e.preventDefault();
          handleSeek([0]); // Seek to start
          break;
        case "End":
          e.preventDefault();
          handleSeek([duration]); // Seek to end
          break;
        case "KeyR":
          e.preventDefault();
          handleReset(); // Reset video
          break;
        case "KeyG":
          e.preventDefault();
          setShowGrid(!showGrid); // Toggle grid
          break;
        case "KeyL":
          e.preventDefault();
          setLayout(layout === "split" ? "mini" : "split"); // Toggle layout
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen(); // Toggle fullscreen
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handlePlayPause,
    handleSeekRelative,
    handleSeek,
    handleReset,
    duration,
    showGrid,
    layout,
    toggleFullscreen,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full bg-background overflow-hidden",
        isFullscreen && "fixed inset-0 z-50",
        className,
      )}
      tabIndex={0}
    >
      <div className="relative w-full h-full flex">
        <div
          className={cn(
            "relative transition-all duration-300 ease-in-out",
            layout === "split" ? "w-1/2" : "w-full",
          )}
        >
          <InstructorVideo
            videoUrl={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            onError={handleVideoError}
            onEnded={handleVideoEnded}
            onLoadedData={handleVideoLoaded}
            ref={videoRef}
          />

          {videoError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm">
              <div className="text-center max-w-md">
                <h3 className="text-xl font-semibold text-destructive mb-2">
                  Video Error
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {videoError.message}
                </p>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleRetryVideo}
                  className="bg-white/10 hover:bg-white/20 text-white"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Video
                </Button>
              </div>
            </div>
          )}

          {isVideoLoading && !videoError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Loading video...
                </p>
              </div>
            </div>
          )}

          {isEnded && !videoError && !isVideoLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm">
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-white mb-4">
                  Workout Complete!
                </h3>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleReset}
                    className="bg-white/10 hover:bg-white/20 text-white"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Start Over
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Split View Webcam */}
        <div
          className={cn(
            "relative transition-all duration-300 ease-in-out",
            layout === "split" ? "w-1/2" : "hidden",
          )}
        >
          {splitWebcamFeed}
        </div>

        {/* Mini Webcam Overlay */}
        {layout === "mini" && isCameraEnabled && !webcamError && (
          <div className="absolute top-4 right-4 w-[320px] h-[180px] rounded-lg overflow-hidden shadow-lg border border-border">
            {miniWebcamFeed}
          </div>
        )}

        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {isCameraEnabled && !webcamError && (
            <LayoutToggle layout={layout} onChange={setLayout} />
          )}
          <GridToggle showGrid={showGrid} onChange={setShowGrid} />
        </div>

        {showGrid && <AlignmentGrid />}

        <div className="absolute bottom-0 left-0 right-0">
          <VideoControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            layout={layout}
            showGrid={showGrid}
            isFullscreen={isFullscreen}
            onPlayPause={handlePlayPause}
            onReset={handleReset}
            onSeek={handleSeek}
            onLayoutToggle={() =>
              setLayout(layout === "split" ? "mini" : "split")
            }
            onGridToggle={() => setShowGrid(!showGrid)}
            onFullscreenToggle={toggleFullscreen}
            disabled={isVideoLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoContainer;
