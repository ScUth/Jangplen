import Link from "next/link";
import { MOCK_LIBRARY } from "@/lib/mockData";
import SongCard from "@/components/SongCard";

export default function Home() {
  const featuredSongs = MOCK_LIBRARY.slice(0, 3);

  return (
    <div className="flex flex-col gap-20 animate-fade-in pb-16">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white drop-shadow-lg">
          Generate <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-sky-400">Masterpieces</span><br/> in Seconds
        </h1>
        <p className="text-xl text-text-muted max-w-2xl mb-10 leading-relaxed">
          Transform your ideas into high-quality, original music. Describe your vibe, choose a genre, and let our AI create the perfect soundtrack for your life.
        </p>
        <div className="flex gap-4">
          <Link href="/create" className="px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-full transition shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] hover:scale-105">
            Start Creating Free
          </Link>
          <Link href="/library" className="px-8 py-4 glass-panel text-white font-bold rounded-full hover:bg-white/5 transition">
            Listen to Library
          </Link>
        </div>
      </section>

      {/* Featured Songs */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Featured Generations</h2>
          <Link href="/library" className="text-brand-500 hover:text-brand-400 transition font-medium">View All &rarr;</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredSongs.map(song => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </section>
      
      {/* How it Works */}
      <section className="glass-panel p-12 rounded-3xl mt-10">
        <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 mb-6 border border-brand-500/30">
              <span className="text-2xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Describe Your Vision</h3>
            <p className="text-text-muted">Enter a prompt, genre, and mood. Provide your own lyrics or let the AI write them for you.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 mb-6 border border-sky-500/30">
              <span className="text-2xl font-bold">2</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">AI Generation</h3>
            <p className="text-text-muted">Our state-of-the-art model processes your inputs and composes a unique, high-fidelity track.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6 border border-purple-500/30">
              <span className="text-2xl font-bold">3</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Listen & Share</h3>
            <p className="text-text-muted">Play your song, download it locally, or share it with friends via a custom link.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
