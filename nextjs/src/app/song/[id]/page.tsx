"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { MOCK_LIBRARY } from "@/lib/mockData";
import { usePlayer, Song } from "@/components/PlayerContext";

const API = "http://localhost:8000";

interface BackendSong {
  id: number;
  title: string;
  audio_url: string | null;
  file: string | null;
  thumbnail_url: string | null;
  lyrics: string;
  genre: string;
  mood: string;
  description: string;
}

function toPlayerSong(s: BackendSong): Song {
  return {
    id: String(s.id),
    title: s.title,
    artist: "AI Generated",
    thumbnail: s.thumbnail_url || "/default-thumbnail.png",
    audioUrl: s.audio_url || s.file || "",
    duration: 0,
    genre: s.genre || "",
    mood: s.mood || "",
    description: s.description || "",
  };
}

export default function SongDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentSong, isPlaying, playSong, pauseSong, resumeSong } = usePlayer();
  
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to fetch from backend first, which does not require authentication
    fetch(`${API}/api/songs/${id}/`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: BackendSong) => {
        setSong(toPlayerSong(data));
        setLoading(false);
      })
      .catch(() => {
        // Fallback to MOCK_LIBRARY if backend fetch fails
        const mockSong = MOCK_LIBRARY.find(s => s.id === id);
        if (mockSong) {
          setSong(mockSong);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center animate-fade-in">
        <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-3xl font-bold text-white mb-4">Loading Song...</h1>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="py-20 text-center animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-4">Song Not Found</h1>
        <p className="text-text-muted mb-8">The song you are looking for does not exist or has been removed.</p>
        <Link href="/" className="px-6 py-3 bg-brand-600 hover:bg-brand-500 rounded-full text-white font-medium transition">
          Return Home
        </Link>
      </div>
    );
  }

  const isThisSongPlaying = currentSong?.id === song.id && isPlaying;

  const handlePlayPause = () => {
    if (currentSong?.id === song.id) {
      if (isPlaying) pauseSong();
      else resumeSong();
    } else {
      playSong(song);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = song.audioUrl;
    link.download = `${song.title}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    alert(`Link copied to clipboard: ${link}`);
  };

  return (
    <div className="py-10 animate-fade-in max-w-4xl mx-auto pb-20">
      <div className="glass-panel p-8 md:p-12 rounded-3xl flex flex-col md:flex-row gap-10 items-center md:items-start relative overflow-hidden">
        {/* Background Blur */}
        <div 
          className="absolute inset-0 opacity-20 blur-3xl scale-150 z-0 pointer-events-none" 
          style={{ backgroundImage: `url(${song.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        ></div>

        {/* Thumbnail */}
        <div className="w-64 h-64 shrink-0 relative z-10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 group">
          <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
            <button 
              onClick={handlePlayPause}
              className="w-20 h-20 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:scale-110 transition"
            >
              {isThisSongPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 flex flex-col relative z-10 text-center md:text-left">
          <div className="inline-block px-3 py-1 bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-full text-xs font-bold tracking-wider mb-4 mx-auto md:mx-0 w-fit">
            AI GENERATED
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">{song.title}</h1>
          <p className="text-xl text-text-muted mb-6">By {song.artist}</p>
          
          <div className="flex flex-wrap gap-4 mb-8 justify-center md:justify-start">
            <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-text-muted">{song.genre}</span>
            <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-text-muted">{song.mood}</span>
          </div>

          <p className="text-text-muted mb-8 leading-relaxed max-w-xl bg-black/20 p-4 rounded-xl border border-white/5">
            "{song.description}"
          </p>

          <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-auto">
            <button 
              onClick={handlePlayPause}
              className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-full transition shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center gap-2"
            >
              {isThisSongPlaying ? (
                <><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg> Pause</>
              ) : (
                <><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg> Play Track</>
              )}
            </button>
            <button onClick={handleShare} className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold rounded-full transition flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
              Share
            </button>
            <button onClick={handleDownload} className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold rounded-full transition flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
