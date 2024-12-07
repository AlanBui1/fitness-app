import { useState, useRef, useEffect } from "react";
import YouTube from "react-youtube";
import { cn } from "@/lib/utils";
import InstructorVideo from "./InstructorVideo";
import WebcamFeed from "./WebcamFeed";
import AlignmentGrid from "./AlignmentGrid";
import VideoControls from "./VideoControls";
import LayoutToggle from "./LayoutToggle";
import GridToggle from "./GridToggle";
import YouTubeInput from "./YouTubeInput";

interface VideoContainerProps {
  className?: string;
  isCameraEnabled?: boolean;
}

const VideoContainer = ({
  className = "",
  isCameraEnabled = false,
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
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const youtubePlayerRef = useRef<any>(null);
  const intervalRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePlayPause = () => {
    if (youtubeVideoId && youtubePlayerRef.current) {
      if (isPlaying) {
        youtubePlayerRef.current.pauseVideo();
      } else {
        youtubePlayerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    if (youtubeVideoId && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(0);
      youtubePlayerRef.current.pauseVideo();
      setCurrentTime(0);
      setIsPlaying(false);
      setIsEnded(false);
    }
  };

  const handleSeek = (value: number[]) => {
    if (youtubeVideoId && youtubePlayerRef.current) {
      const newTime = value[0];
      youtubePlayerRef.current.seekTo(newTime);
      setCurrentTime(newTime);
      if (newTime < duration) {
        setIsEnded(false);
      }
    }
  };

  const handleYouTubeReady = (event: any) => {
    youtubePlayerRef.current = event.target;
    setDuration(event.target.getDuration());
    setIsVideoLoading(false);
  };

  const handleYouTubeStateChange = (event: any) => {
    switch (event.data) {
      case 0: // ended
        setIsPlaying(false);
        setIsEnded(true);
        break;
      case 1: // playing
        setIsPlaying(true);
        break;
      case 2: // paused
        setIsPlaying(false);
        break;
      default:
        break;
    }
  };

  const handleYouTubeError = (error: any) => {
    console.error("YouTube player error:", error);
    setVideoError(new Error("Failed to load YouTube video"));
    setIsVideoLoading(false);
  };

  const handleYouTubePlaybackTime = () => {
    if (youtubePlayerRef.current) {
      setCurrentTime(youtubePlayerRef.current.getCurrentTime());
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Start time update interval when playing
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(handleYouTubePlaybackTime, 1000);
    }
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full bg-background overflow-hidden",
        isFullscreen && "fixed inset-0 z-50",
        className,
      )}
    >
      <div className="absolute top-4 left-4 right-4 z-30">
        <YouTubeInput onSubmit={setYoutubeVideoId} />
      </div>

      <div className="relative w-full h-full flex mt-16">
        {/* Main Container */}
        <div className="relative flex w-full h-full transition-all duration-300 ease-in-out">
          {/* Video Container */}
          <div
            className={cn(
              "relative h-full transition-all duration-300 ease-in-out",
              layout === "split" && !isFullscreen ? "w-1/2" : "w-full",
            )}
            style={{ minHeight: "400px" }}
          >
            {youtubeVideoId && (
              <div className="absolute inset-0">
                <YouTube
                  videoId={youtubeVideoId}
                  opts={{
                    playerVars: {
                      autoplay: 0,
                      controls: 0,
                      modestbranding: 1,
                      rel: 0,
                      playsinline: 1,
                      enablejsapi: 1,
                    },
                    width: "100%",
                    height: "100%",
                  }}
                  onReady={handleYouTubeReady}
                  onStateChange={handleYouTubeStateChange}
                  onError={handleYouTubeError}
                  className="w-full h-full"
                  iframeClassName="w-full h-full absolute inset-0"
                />
              </div>
            )}

            {!youtubeVideoId && (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Enter a YouTube URL to begin
              </div>
            )}
          </div>

          {/* Webcam Feed */}
          {layout === "split" && (
            <div
              className={cn(
                "relative h-full transition-all duration-300 ease-in-out",
                !isFullscreen
                  ? "w-1/2"
                  : "absolute top-4 right-4 w-[320px] h-[180px]",
              )}
              style={!isFullscreen ? { minHeight: "400px" } : {}}
            >
              <div
                className={cn(
                  "w-full h-full",
                  isFullscreen &&
                    "rounded-lg overflow-hidden shadow-lg border border-border",
                )}
              >
                <WebcamFeed
                  key="split-webcam"
                  isEnabled={isCameraEnabled}
                  className="w-full h-full"
                  onError={setWebcamError}
                />
              </div>
            </div>
          )}

          {/* Mini Webcam Overlay */}
          {layout === "mini" && isCameraEnabled && !webcamError && (
            <div className="absolute top-4 right-4 w-[320px] h-[180px] rounded-lg overflow-hidden shadow-lg border border-border">
              <WebcamFeed
                key="mini-webcam"
                isEnabled={isCameraEnabled}
                className="w-full h-full"
                onError={setWebcamError}
              />
            </div>
          )}
        </div>

        {/* Floating Controls */}
        <div className="absolute top-20 left-4 z-10 flex flex-col gap-2">
          {isCameraEnabled && !webcamError && (
            <LayoutToggle layout={layout} onChange={setLayout} />
          )}
          <GridToggle showGrid={showGrid} onChange={setShowGrid} />
        </div>

        {/* Alignment Grid Overlay */}
        {showGrid && <AlignmentGrid />}

        {/* Video Controls */}
        {youtubeVideoId && (
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
        )}
      </div>
    </div>
  );
};

export default VideoContainer;
