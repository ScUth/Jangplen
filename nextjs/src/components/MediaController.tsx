"use client";

import { useState, useRef, useEffect } from "react";
import { usePlayer } from "./PlayerContext";

export default function MediaController() {
  const { currentSong, isPlaying, pauseSong, resumeSong } = usePlayer();
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isLooping, setIsLooping] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => console.log("Audio playback prevented"));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    if (audioRef.current) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-panel border-t border-white/10 p-4 z-50 animate-fade-in shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        src={currentSong.audioUrl} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => !isLooping && pauseSong()}
      />
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4 md:gap-8">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-full md:w-1/4">
          <img src={currentSong.thumbnail} alt="Thumbnail" className="w-14 h-14 rounded-md object-cover shadow-lg" />
          <div className="flex flex-col truncate">
            <span className="font-semibold text-white truncate">{currentSong.title}</span>
            <span className="text-sm text-text-muted truncate">{currentSong.artist}</span>
          </div>
        </div>

        {/* Controls & Progress */}
        <div className="flex-1 w-full flex flex-col items-center gap-2">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsLooping(!isLooping)}
              className={`p-2 rounded-full transition ${isLooping ? 'text-brand-500 bg-brand-500/10' : 'text-text-muted hover:text-white'}`}
              title="Loop"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
            </button>
            <button 
              onClick={isPlaying ? pauseSong : resumeSong}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition shadow-lg"
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              )}
            </button>
          </div>
          
          <div className="w-full flex items-center gap-3 text-xs text-text-muted">
            <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress} 
              onChange={handleProgressChange}
              className="flex-1"
            />
            <span>{formatTime(audioRef.current?.duration || currentSong.duration)}</span>
          </div>
        </div>

        {/* Volume & Extras */}
        <div className="hidden md:flex items-center justify-end gap-3 w-1/4">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={volume} 
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}
