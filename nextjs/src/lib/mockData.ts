import { Song } from "../components/PlayerContext";

export interface LibraryData {
  id: string;
  name: string;
  description: string;
  songs: Song[];
}

export const MOCK_LIBRARY: Song[] = [
  {
    id: "mock-1",
    title: "Neon Dreams",
    artist: "AI Creator",
    thumbnail: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: 372,
    genre: "Synthwave",
    mood: "Energetic",
    description: "A fast-paced synthwave track with heavy bass."
  },
  {
    id: "mock-2",
    title: "Midnight Rain",
    artist: "AI Creator",
    thumbnail: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=500&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: 425,
    genre: "Lo-Fi",
    mood: "Chill",
    description: "Relaxing lo-fi beats to study to."
  },
  {
    id: "mock-3",
    title: "Solar Flare",
    artist: "AI Creator",
    thumbnail: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=500&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: 344,
    genre: "Electronic",
    mood: "Uplifting",
    description: "High energy electronic music with a bright melody."
  }
];

export const MOCK_LIBRARIES: LibraryData[] = [
  {
    id: "lib-1",
    name: "My Synthwave Mix",
    description: "All my best retro and energetic tracks.",
    songs: [MOCK_LIBRARY[0]]
  },
  {
    id: "lib-2",
    name: "Chill Study Beats",
    description: "Lo-fi and relaxing music generated for deep focus.",
    songs: [MOCK_LIBRARY[1], MOCK_LIBRARY[2]]
  }
];

export const MOCK_PROMPTS = [
  "A chill lo-fi beat with a saxophone solo",
  "An energetic synthwave track for late night driving",
  "A dramatic orchestral piece with heavy percussion"
];
