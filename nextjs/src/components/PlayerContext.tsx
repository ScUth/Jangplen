"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Song {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  audioUrl: string;
  duration: number;
  genre: string;
  mood: string;
  description: string;
}

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  playSong: (song: Song) => void;
  pauseSong: () => void;
  resumeSong: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playSong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const pauseSong = () => setIsPlaying(false);
  const resumeSong = () => setIsPlaying(true);

  return (
    <PlayerContext.Provider value={{ currentSong, isPlaying, playSong, pauseSong, resumeSong }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
