import { Button } from "@/components/ui/button";
import { Layout, Minimize2, Grid, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import PlaybackControls from "./PlaybackControls";

interface VideoControlsProps {
  className?: string;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  layout?: "split" | "mini";
  showGrid?: boolean;
  isFullscreen?: boolean;
  disabled?: boolean;
  onPlayPause?: () => void;
  onReset?: () => void;
  onSeek?: (value: number[]) => void;
  onLayoutToggle?: () => void;
  onGridToggle?: () => void;
  onFullscreenToggle?: () => void;
}

const VideoControls = ({
  className = "",
  isPlaying = false,
  currentTime = 0,
  duration = 100,
  layout = "split",
  showGrid = false,
  isFullscreen = false,
  disabled = false,
  onPlayPause = () => {},
  onReset = () => {},
  onSeek = () => {},
  onLayoutToggle = () => {},
  onGridToggle = () => {},
  onFullscreenToggle = () => {},
}: VideoControlsProps) => {
  return (
    <div
      className={cn(
        "w-full p-4 bg-gradient-to-t from-black/80 to-transparent",
        className,
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      <div className="flex flex-col gap-2">
        {/* Playback Controls */}
        <PlaybackControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onPlayPause={onPlayPause}
          onReset={onReset}
          onSeek={onSeek}
          disabled={disabled}
        />

        {/* Additional Controls Row */}
        <div className="flex items-center justify-end gap-2">
          {/* Layout Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onLayoutToggle}
            className="text-white hover:bg-white/20"
            disabled={disabled}
          >
            {layout === "split" ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Layout className="h-4 w-4" />
            )}
          </Button>

          {/* Grid Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onGridToggle}
            className={cn(
              "text-white hover:bg-white/20",
              showGrid && "bg-white/20",
            )}
            disabled={disabled}
          >
            <Grid className="h-4 w-4" />
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onFullscreenToggle}
            className="text-white hover:bg-white/20"
            disabled={disabled}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoControls;
