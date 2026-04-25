"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MOCK_PROMPTS } from "@/lib/mockData";
import { API_BASE_URL } from "@/lib/constants";

const POLL_INTERVAL_MS = 5000;
const TIMEOUT_MINUTES = 10;
const API = API_BASE_URL;

type GenStatus =
  | "idle" | "submitting" | "PENDING"
  | "TEXT_SUCCESS" | "FIRST_SUCCESS" | "SUCCESS"
  | "failed" | "timeout";

interface RawSong {
  title: string;
  audio_url: string;
  stream_audio_url: string;
  thumbnail_url: string;
  lyrics: string;
  genre: string;
  duration: number | null;
  suno_id: string;
}

interface Library { id: number; name: string; description: string; }

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Queued — waiting to start…",
  TEXT_SUCCESS: "Lyrics generated, composing music…",
  FIRST_SUCCESS: "First track ready, finishing up…",
  SUCCESS: "Song generated!",
};

function progressPercent(s: GenStatus) {
  if (s === "PENDING") return 12;
  if (s === "TEXT_SUCCESS") return 42;
  if (s === "FIRST_SUCCESS") return 78;
  if (s === "SUCCESS") return 100;
  return 5;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Mini audio player ────────────────────────────────────────────────────────
function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Number(e.target.value);
    setCurrentTime(Number(e.target.value));
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrentTime(a.currentTime);
    const onLoad = () => setDuration(a.duration);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoad);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onLoad);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  return (
    <div className="flex items-center gap-3 bg-black/30 rounded-xl p-3 border border-white/10">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={toggle}
        className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-500 flex items-center justify-center flex-shrink-0 transition"
      >
        {playing ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
        )}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <input
          type="range" min={0} max={duration || 100} step={0.5}
          value={currentTime} onChange={seek}
          className="w-full accent-brand-500 h-1.5 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-text-muted">
          <span>{formatTime(Math.floor(currentTime))}</span>
          <span>{duration ? formatTime(Math.floor(duration)) : "--:--"}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Song Finish Card ─────────────────────────────────────────────────────────
function FinishCard({
  songs, onSave, onDiscard, defaultLibraryId, allLibraries, isMockMode,
}: {
  songs: RawSong[];
  onSave: (song: RawSong, libraryId: string | number, libraryName: string) => Promise<void>;
  onDiscard: () => void;
  defaultLibraryId?: string | number;
  allLibraries?: Library[];
  isMockMode?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const [libraries, setLibraries] = useState<Library[]>(allLibraries ?? []);
  const [libraryId, setLibraryId] = useState<string>(
    defaultLibraryId ? String(defaultLibraryId) : (allLibraries?.length ? String(allLibraries[0].id) : "new")
  );
  const [libraryName, setLibraryName] = useState("My New Library");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    // Only re-fetch if not provided by parent
    if (allLibraries && allLibraries.length > 0) return;
    const token = localStorage.getItem("token");
    fetch(`${API}/api/libraries/mine/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((r) => r.json())
      .then((data: Library[]) => {
        setLibraries(data);
        if (!defaultLibraryId && data.length > 0) setLibraryId(String(data[0].id));
      })
      .catch(() => { });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await onSave(songs[selected], libraryId, libraryName);
    } catch (e: any) {
      setSaveError(e.message || "Failed to save.");
      setSaving(false);
    }
  };

  const song = songs[selected];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f0f1a] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="relative">
          {song.thumbnail_url ? (
            <img src={song.thumbnail_url} alt={song.title}
              className="w-full h-44 object-cover opacity-70" />
          ) : (
            <div className="w-full h-44 bg-gradient-to-br from-brand-900 to-sky-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <div className="inline-flex items-center gap-1.5 bg-green-500/20 border border-green-500/40 text-green-400 text-xs px-3 py-1 rounded-full mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              Generation complete!
            </div>
            <h2 className="text-2xl font-bold text-white truncate">{song.title}</h2>
            {song.genre && <p className="text-xs text-text-muted mt-0.5">{song.genre}</p>}
          </div>
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* Track selector (if Suno returned 2 songs) */}
          {songs.length > 1 && (
            <div className="flex gap-2">
              {songs.map((s, i) => (
                <button key={i} onClick={() => setSelected(i)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${selected === i
                    ? "bg-brand-600 border-brand-500 text-white"
                    : "bg-white/5 border-white/10 text-text-muted hover:bg-white/10"
                    }`}
                >
                  Track {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* Player */}
          <AudioPlayer src={song.audio_url || song.stream_audio_url} />

          {/* Library selector */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Save to library
            </label>

            <select
              value={libraryId}
              onChange={(e) => setLibraryId(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-brand-500 transition mb-3"
            >
              {libraries.map((lib) => (
                <option key={lib.id} value={String(lib.id)}>{lib.name}</option>
              ))}
              <option value="new">+ Create new library…</option>
            </select>

            {libraryId === "new" && (
              <input
                type="text"
                placeholder="New library name"
                value={libraryName}
                onChange={(e) => setLibraryName(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-brand-500 transition"
              />
            )}
          </div>

          {saveError && (
            <p className="text-red-400 text-sm">{saveError}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onDiscard}
              className="flex-1 py-3 rounded-xl border border-white/10 text-text-muted hover:bg-white/5 transition text-sm"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={isMockMode || saving || (libraryId === "new" && !libraryName.trim())}
              title={isMockMode ? "Saving is disabled in Mock Mode" : undefined}
              className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition disabled:opacity-50 text-sm"
            >
              {isMockMode ? "Mock Mode (Save Disabled)" : saving ? "Saving…" : "Save to Library"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreateSong() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "", genre: "", mood: "", singer: "", description: "", lyrics: "",
  });
  const [useMock, setUseMock] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | number>("");
  const [genStatus, setGenStatus] = useState<GenStatus>("idle");
  const [statusLabel, setStatusLabel] = useState("");
  const [error, setError] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [finishedSongs, setFinishedSongs] = useState<RawSong[] | null>(null);

  const taskIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => stopPolling(), []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API}/api/libraries/mine/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((r) => r.json())
      .then((data: Library[]) => {
        setLibraries(data);
        if (data.length > 0) setSelectedLibraryId(String(data[0].id));
      })
      .catch(() => { });
  }, []);

  const stopPolling = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (elapsedTimer.current) clearInterval(elapsedTimer.current);
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setThumbnailPreview(URL.createObjectURL(file));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setElapsedSec(0); setFinishedSongs(null);
    setGenStatus("submitting");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to generate songs.");
      setGenStatus("idle"); return;
    }

    const hasCustom = formData.title.trim() && formData.genre.trim();
    const payload: Record<string, unknown> = {
      prompt: formData.lyrics.trim() || formData.description.trim(),
      custom_mode: !!hasCustom,
      instrumental: !formData.lyrics.trim() && !formData.description.trim(),
      use_mock: useMock,
    };
    if (hasCustom) {
      payload.style = [formData.genre, formData.mood, formData.singer].filter(Boolean).join(", ");
      payload.title = formData.title;
    }

    try {
      const res = await fetch(`${API}/api/suno/generate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));

      taskIdRef.current = data.task_id;
      startedAtRef.current = data.started_at;
      setGenStatus("PENDING");
      setStatusLabel(STATUS_LABELS["PENDING"]);
      startPolling();
    } catch (err: any) {
      setError(err.message || "Failed to start generation.");
      setGenStatus("idle");
    }
  };

  // ── Polling ─────────────────────────────────────────────────────────────────
  const startPolling = () => {
    elapsedTimer.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    pollTimerRef.current = setInterval(pollStatus, POLL_INTERVAL_MS);
    setTimeout(pollStatus, 500); // immediate first check
  };

  const pollStatus = async () => {
    const taskId = taskIdRef.current;
    const startedAt = startedAtRef.current;
    if (!taskId) return;

    const token = localStorage.getItem("token");
    try {
      const url = new URL(`${API}/api/suno/status/${taskId}/`);
      if (startedAt) url.searchParams.set("started_at", String(startedAt));

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Token ${token}` },
      });

      if (res.status === 408) {
        stopPolling(); setGenStatus("timeout");
        setStatusLabel("Generation timed out after 10 minutes."); return;
      }
      if (res.status === 422) {
        stopPolling(); const d = await res.json();
        setGenStatus("failed"); setError(d.message || "Generation failed."); return;
      }

      const data = await res.json();
      const s: string = data.status;
      if (STATUS_LABELS[s]) { setGenStatus(s as GenStatus); setStatusLabel(STATUS_LABELS[s]); }

      if (res.status === 200 && s === "SUCCESS") {
        stopPolling();
        setFinishedSongs(data.songs as RawSong[]);
        setGenStatus("SUCCESS");
      }

      if (startedAt && Date.now() / 1000 - startedAt > TIMEOUT_MINUTES * 60) {
        stopPolling(); setGenStatus("timeout");
        setStatusLabel("Generation timed out after 10 minutes.");
      }
    } catch (err) { console.error("Poll error:", err); }
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (song: RawSong, libId: string | number, libName: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/api/suno/save/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      body: JSON.stringify({
        library_id: libId,
        library_name: libName,
        title: song.title,
        audio_url: song.audio_url,
        thumbnail_url: song.thumbnail_url,
        lyrics: song.lyrics,
        genre: song.genre,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    setFinishedSongs(null);
    router.push("/library");
  };

  const isGenerating =
    genStatus === "submitting" || genStatus === "PENDING" ||
    genStatus === "TEXT_SUCCESS" || genStatus === "FIRST_SUCCESS";

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Finish card overlay */}
      {finishedSongs && (
        <FinishCard
          songs={finishedSongs}
          onSave={handleSave}
          onDiscard={() => { setFinishedSongs(null); setGenStatus("idle"); }}
          defaultLibraryId={selectedLibraryId}
          allLibraries={libraries}
          isMockMode={useMock}
        />
      )}

      <div className="max-w-3xl mx-auto py-10 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Create New Song</h1>
            <p className="text-text-muted">Fill in the details to generate your unique AI track.</p>
          </div>
          
          {/* Mode Switcher */}
          <div className="flex items-center gap-3 bg-black/30 p-1.5 rounded-full border border-white/10 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setUseMock(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${!useMock ? 'bg-brand-600 text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
            >
              Real AI
            </button>
            <button
              type="button"
              onClick={() => setUseMock(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${useMock ? 'bg-brand-600 text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
            >
              Mock Mode
            </button>
          </div>
        </div>

        {/* Timeout banner */}
        {genStatus === "timeout" && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            Generation exceeded 10 minutes and was rejected. Please try again.
            <button onClick={() => setGenStatus("idle")} className="ml-auto underline text-xs">Dismiss</button>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="glass-panel p-8 rounded-2xl flex flex-col gap-6">

          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "Song Title", key: "title", placeholder: "e.g. Neon Nights" },
              { label: "Genre / Style", key: "genre", placeholder: "e.g. Synthwave, Jazz" },
              { label: "Mood", key: "mood", placeholder: "e.g. Energetic, Melancholic" },
              { label: "Vocal Style (Optional)", key: "singer", placeholder: "e.g. Soft female, Deep male" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-white mb-2">{label}</label>
                <input
                  type="text"
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-brand-500 transition"
                  placeholder={placeholder}
                  value={formData[key as keyof typeof formData]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description / Prompt <span className="text-text-muted font-normal">(required if no lyrics)</span>
            </label>
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {MOCK_PROMPTS.map((p, i) => (
                <button key={i} type="button"
                  onClick={() => setFormData((f) => ({ ...f, description: p }))}
                  className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 whitespace-nowrap hover:bg-brand-500/20 hover:border-brand-500/50 transition text-text-muted"
                >{p}</button>
              ))}
            </div>
            <textarea
              className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-brand-500 transition h-24 resize-none"
              placeholder="Describe the vibe, story, or feeling of your song…"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Lyrics */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Custom Lyrics <span className="text-text-muted font-normal">(optional — leave empty for AI to write)</span>
            </label>
            <textarea
              className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-brand-500 transition h-32 resize-none"
              placeholder="Paste your own lyrics here…"
              value={formData.lyrics}
              onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
            />
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Custom Thumbnail (Optional)</label>
            <div className="flex items-center gap-4">
              {thumbnailPreview && (
                <img src={thumbnailPreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-white/20" />
              )}
              <input type="file" accept="image/*" onChange={handleThumbnailUpload}
                className="text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-brand-600 file:text-white hover:file:bg-brand-500 transition"
              />
            </div>
          </div>

          {/* Library selector */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Save to Library
            </label>
            {libraries.length === 0 ? (
              <p className="text-text-muted text-sm">
                You have no libraries yet — one will be created automatically when you save.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {libraries.map((lib) => (
                  <button
                    key={lib.id}
                    type="button"
                    onClick={() => setSelectedLibraryId(String(lib.id))}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition ${selectedLibraryId === String(lib.id)
                      ? "border-brand-500 bg-brand-500/10 text-white"
                      : "border-white/10 bg-white/5 text-text-muted hover:border-white/30 hover:text-white"
                      }`}
                  >
                    {/* mini thumbnail mosaic */}
                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-brand-900/60">
                      {lib.songs?.[0]?.thumbnail_url ? (
                        <img src={lib.songs[0].thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{lib.name}</p>
                      <p className="text-[10px] text-text-muted">{lib.song_count ?? 0} songs</p>
                    </div>
                    {selectedLibraryId === String(lib.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-brand-400 flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedLibraryId("new")}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition ${selectedLibraryId === "new"
                    ? "border-brand-500 bg-brand-500/10 text-white"
                    : "border-white/10 border-dashed bg-transparent text-text-muted hover:border-white/30 hover:text-white"
                    }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                  </div>
                  <p className="text-sm font-medium">New Library</p>
                </button>
              </div>
            )}
          </div>

          {/* Generation */}
          <div className="mt-2">
            {isGenerating ? (
              <div className="bg-black/40 border border-brand-500/30 rounded-xl p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-bold animate-pulse">
                    {genStatus === "submitting" ? "Submitting request…" : statusLabel}
                  </h3>
                  <span className="text-xs text-text-muted tabular-nums">
                    {formatTime(elapsedSec)} / {TIMEOUT_MINUTES}:00
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 mb-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-brand-600 to-sky-400 h-3 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(139,92,246,0.8)]"
                    style={{ width: `${progressPercent(genStatus)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-text-muted px-1">
                  {["Queued", "Lyrics", "Composing", "Done"].map((step, i) => {
                    const active =
                      (i === 0 && genStatus !== "submitting") ||
                      (i === 1 && (genStatus === "TEXT_SUCCESS" || genStatus === "FIRST_SUCCESS")) ||
                      (i === 2 && genStatus === "FIRST_SUCCESS") ||
                      (i === 3 && genStatus === "SUCCESS");
                    return (
                      <span key={step} className={active ? "text-brand-400 font-semibold" : ""}>{step}</span>
                    );
                  })}
                </div>
                <p className="text-xs text-text-muted mt-3 text-center">
                  AI music generation typically takes 2–3 minutes. Please keep this page open.
                </p>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!formData.description.trim() && !formData.lyrics.trim()}
                className="w-full py-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 rounded-xl text-white font-bold text-lg shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none"
              >
                ✨ Generate Song
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
