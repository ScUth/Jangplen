"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/constants";

const API = API_BASE_URL;

interface Library {
  id: number;
  name: string;
  description: string;
  song_count: number;
  songs: { thumbnail_url: string }[];
}

function LibraryCard({ library }: { library: Library }) {
  // Show up to 4 thumbnails as a mosaic
  const thumbs = library.songs.slice(0, 4).map((s) => s.thumbnail_url).filter(Boolean);

  return (
    <Link href={`/library/${library.id}`}>
      <div className="glass-panel rounded-2xl overflow-hidden group hover:border-brand-500/50 transition duration-300 cursor-pointer">
        {/* Thumbnail grid */}
        <div className="relative w-full aspect-square bg-gradient-to-br from-brand-900/60 to-sky-900/60">
          {thumbs.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/20"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            </div>
          ) : thumbs.length === 1 ? (
            <img src={thumbs[0]} alt={library.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          ) : (
            <div className="grid grid-cols-2 w-full h-full">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="overflow-hidden">
                  {thumbs[i] ? (
                    <img src={thumbs[i]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  ) : (
                    <div className="w-full h-full bg-brand-900/40" />
                  )}
                </div>
              ))}
            </div>
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-white font-bold truncate">{library.name}</h3>
          <p className="text-text-muted text-xs mt-0.5">
            {library.song_count} {library.song_count === 1 ? "song" : "songs"}
          </p>
          {library.description && (
            <p className="text-text-muted text-xs mt-1 line-clamp-2">{library.description}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Library() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/api/libraries/mine/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load libraries.");
        return res.json();
      })
      .then((data) => { setLibraries(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  return (
    <div className="py-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Your Libraries</h1>
          <p className="text-text-muted">Manage all your collections of AI-generated masterpieces.</p>
        </div>
        <Link
          href="/create"
          className="px-6 py-3 bg-brand-600 hover:bg-brand-500 rounded-full text-white font-medium transition shadow-lg inline-flex items-center justify-center gap-2 max-w-xs w-full md:w-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Create Song
        </Link>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-white/5" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="glass-panel p-6 rounded-2xl text-red-400 text-sm">{error}</div>
      )}

      {!loading && !error && libraries.length === 0 && (
        <div className="glass-panel p-16 rounded-2xl text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-text-muted mb-4 opacity-50"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          <h2 className="text-2xl font-bold text-white mb-2">No libraries yet</h2>
          <p className="text-text-muted mb-6">Generate a song and save it to create your first library!</p>
          <Link href="/create" className="text-brand-400 hover:text-brand-300 transition">Go to Creator &rarr;</Link>
        </div>
      )}

      {!loading && !error && libraries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {libraries.map((lib) => (
            <LibraryCard key={lib.id} library={lib} />
          ))}
        </div>
      )}
    </div>
  );
}
