"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePlayer } from "@/components/PlayerContext";
import type { Song } from "@/components/PlayerContext";
import { API_BASE_URL } from "@/lib/constants";

const API = API_BASE_URL;

interface BackendSong {
  id: number;
  title: string;
  audio_url: string | null;
  thumbnail_url: string | null;
  lyrics: string;
  genre: string;
  mood: string;
  description: string;
}

interface LibraryDetail {
  id: number;
  name: string;
  description: string;
  song_count: number;
  songs: BackendSong[];
}

/** Map the Django snake_case response to the PlayerContext Song shape */
function toPlayerSong(s: BackendSong): Song {
  return {
    id: String(s.id),
    title: s.title,
    artist: "AI Generated",
    thumbnail: s.thumbnail_url || "/default-thumbnail.png",
    audioUrl: s.audio_url || "",
    duration: 0,
    genre: s.genre || "",
    mood: s.mood || "",
    description: s.description || "",
  };
}

function formatDuration(sec: number) {
  if (!sec) return "--:--";
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function LibraryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentSong, isPlaying, playSong, pauseSong, resumeSong } = usePlayer();

  const [lib, setLib] = useState<LibraryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/api/libraries/${id}/detail/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Library not found or access denied.");
        return res.json();
      })
      .then((data) => { setLib(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [id]);

  const handlePlayPause = (song: BackendSong) => {
    const ps = toPlayerSong(song);
    if (currentSong?.id === ps.id) {
      isPlaying ? pauseSong() : resumeSong();
    } else {
      playSong(ps);
    }
  };

  if (loading) {
    return (
      <div className="py-10 animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-white/5" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10">
        <div className="glass-panel p-8 rounded-2xl text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/library" className="text-brand-400 hover:text-brand-300 transition">
            &larr; Back to Libraries
          </Link>
        </div>
      </div>
    );
  }

  if (!lib) return null;

  return (
    <div className="py-10 animate-fade-in pb-24">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 text-text-muted hover:text-white transition text-sm mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          All Libraries
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">{lib.name}</h1>
            <p className="text-text-muted">
              {lib.description || "No description."}
              <span className="mx-2">·</span>
              {lib.song_count} {lib.song_count === 1 ? "song" : "songs"}
            </p>
          </div>
          <Link
            href="/create"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-full text-white text-sm font-medium transition inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Add Song
          </Link>
        </div>
      </div>

      {/* Songs */}
      {lib.songs.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-text-muted mb-4 opacity-50"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          <h2 className="text-xl font-bold text-white mb-2">This library is empty</h2>
          <p className="text-text-muted mb-6">Generate a song and save it here.</p>
          <Link href="/create" className="text-brand-400 hover:text-brand-300 transition">Go to Creator &rarr;</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {lib.songs.map((song) => {
            const ps = toPlayerSong(song);
            const active = currentSong?.id === ps.id;
            const playing = active && isPlaying;

            return (
              <div
                key={song.id}
                className={`glass-panel p-4 rounded-2xl group hover:border-brand-500/50 transition duration-300 flex flex-col relative overflow-hidden ${
                  active ? "border-brand-500/60" : ""
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-4">
                  {song.thumbnail_url ? (
                    <img
                      src={song.thumbnail_url}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-900/60 to-sky-900/60 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/30"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                    </div>
                  )}

                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                    <button
                      onClick={() => handlePlayPause(song)}
                      className="w-14 h-14 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.6)] hover:scale-110 transition"
                    >
                      {playing ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                      )}
                    </button>
                  </div>

                  {/* Now-playing indicator */}
                  {playing && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-brand-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <span className="inline-block w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="inline-block w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="inline-block w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white truncate">{song.title}</h3>
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    {[song.genre, song.mood].filter(Boolean).join(" · ") || "AI Generated"}
                  </p>
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        if (song.audio_url) {
                          const a = document.createElement("a");
                          a.href = song.audio_url;
                          a.download = `${song.title}.mp3`;
                          a.click();
                        }
                      }}
                      disabled={!song.audio_url}
                      className="p-1.5 text-text-muted hover:text-white hover:bg-white/10 rounded-full transition disabled:opacity-30"
                      title="Download"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    </button>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/song/${song.id}`;
                        navigator.clipboard.writeText(link);
                        alert(`Link copied to clipboard: ${link}`);
                      }}
                      className="p-1.5 text-text-muted hover:text-white hover:bg-white/10 rounded-full transition"
                      title="Share"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
                    </button>
                  </div>
                  <button
                    onClick={() => handlePlayPause(song)}
                    className={`p-1.5 rounded-full transition ${
                      playing
                        ? "text-brand-400 bg-brand-500/20"
                        : "text-text-muted hover:text-white hover:bg-white/10"
                    }`}
                    title={playing ? "Pause" : "Play"}
                  >
                    {playing ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
