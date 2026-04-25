"use client";

import { usePlayer, Song } from "./PlayerContext";

interface SongCardProps {
  song: Song;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}

export default function SongCard({ song, onDelete, showDelete = false }: SongCardProps) {
  const { currentSong, isPlaying, playSong, pauseSong, resumeSong } = usePlayer();
  const isThisSongPlaying = currentSong?.id === song.id && isPlaying;

  const handlePlayPause = () => {
    if (currentSong?.id === song.id) {
      if (isPlaying) pauseSong();
      else resumeSong();
    } else {
      playSong(song);
    }
  };

  const handleShare = () => {
    const link = `${window.location.origin}/song/${song.id}`;
    navigator.clipboard.writeText(link);
    alert(`Link copied to clipboard: ${link}`);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = song.audioUrl;
    link.download = `${song.title}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel p-4 rounded-2xl group hover:border-brand-500/50 transition duration-300 flex flex-col relative overflow-hidden">
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-4">
        <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
          <button 
            onClick={handlePlayPause}
            className="w-14 h-14 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.6)] hover:scale-110 transition"
          >
            {isThisSongPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex-1">
        <h3 className="text-lg font-bold text-white truncate">{song.title}</h3>
        <p className="text-sm text-text-muted mb-2 truncate">{song.genre} • {song.mood}</p>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
        <div className="flex gap-2">
          <button onClick={handleShare} className="p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-full transition" title="Share">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
          </button>
          <button onClick={handleDownload} className="p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-full transition" title="Download">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          </button>
        </div>
        {showDelete && onDelete && (
          <button onClick={() => onDelete(song.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}
