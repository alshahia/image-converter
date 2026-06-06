import { type ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';

export interface VideoMetadata {
  duration: number;
  videoWidth: number;
  videoHeight: number;
}

export interface VideoPlayerProps {
  src: string;
  fileName?: string;
  onLoadedMetadata?: (meta: VideoMetadata) => void;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function VideoPlayer({
  src,
  fileName,
  onLoadedMetadata,
  className = '',
  autoPlay = false,
  controls = true,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onLoaded = () => {
      const d = Number.isFinite(video.duration) ? video.duration : 0;
      setDuration(d);
      setError(null);
      if (onLoadedMetadata) {
        onLoadedMetadata({
          duration: d,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
        });
      }
    };
    const onError = () => setError('Could not load the video preview.');
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('error', onError);
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
    };
  }, [onLoadedMetadata]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => {
        // ignore autoplay restrictions
      });
    } else {
      video.pause();
    }
  }, []);

  const onScrub = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const next = Number(e.target.value);
    video.currentTime = next;
    setCurrentTime(next);
  }, []);

  return (
    <div
      className={`flex w-full flex-col gap-3 rounded-glass-sm border border-white/60 bg-black/5 p-2 shadow-glass-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-3 ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay={autoPlay}
        playsInline
        preload="metadata"
        className="block max-h-[60vh] w-full rounded bg-black object-contain"
        aria-label={fileName ?? 'Video preview'}
      >
        <track kind="captions" />
      </video>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : (
        controls && (
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="min-h-11 min-w-11"
            >
              {isPlaying ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                  role="img"
                  aria-hidden="true"
                >
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                  role="img"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </Button>
            <span className="min-w-[3.5rem] font-mono text-xs text-neutral-600 dark:text-neutral-400">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(0, duration)}
              step={0.01}
              value={currentTime}
              onChange={onScrub}
              disabled={duration === 0}
              aria-label="Video position"
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-neutral-200 accent-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800 dark:accent-brand-400"
            />
            <span className="min-w-[3.5rem] font-mono text-xs text-neutral-600 dark:text-neutral-400">
              {formatTime(duration)}
            </span>
          </div>
        )
      )}
    </div>
  );
}
