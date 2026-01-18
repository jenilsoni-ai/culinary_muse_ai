
import React, { useState } from 'react';

const PLAYLISTS = [
  { id: 'jfKfPfyJRdk', title: 'Lofi Cooking', icon: '🍳' },
  { id: '5qap5aO4i9A', title: 'Smooth Jazz', icon: '🎷' },
  { id: 'S_MOd40zlYU', title: 'Nature Ambient', icon: '🌿' },
  { id: '1-69Y8K8p6s', title: 'Classical Focus', icon: '🎻' }
];

const MusicPlayer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(PLAYLISTS[0]);

  return (
    <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-start gap-4">
      {isOpen && (
        <div className="bg-white rounded-[2.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.3)] border border-stone-100 p-8 w-[400px] animate-in slide-in-from-bottom-10 duration-500 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-ping absolute inset-0"></div>
                <div className="w-3 h-3 bg-orange-500 rounded-full relative"></div>
              </div>
              <span className="text-[11px] font-black text-stone-400 uppercase tracking-[0.25em]">Kitchen Ambient</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="bg-stone-100 p-2.5 rounded-2xl text-stone-400 hover:text-stone-900 hover:bg-stone-200 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="rounded-[2.2rem] overflow-hidden aspect-video bg-stone-900 mb-8 shadow-2xl relative group border-4 border-stone-50">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${currentTrack.id}?autoplay=1&mute=0&controls=1&modestbranding=1&rel=0&enablejsapi=1&origin=${window.location.origin}`}
              title="YouTube Ambient Player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000"
            ></iframe>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {PLAYLISTS.map(track => (
              <button
                key={track.id}
                onClick={() => setCurrentTrack(track)}
                className={`py-4 rounded-[1.5rem] text-2xl flex items-center justify-center transition-all ${currentTrack.id === track.id ? 'bg-orange-500 text-white shadow-xl scale-110 -translate-y-1' : 'bg-stone-50 text-stone-400 hover:bg-stone-100 hover:scale-105'}`}
                title={track.title}
              >
                {track.icon}
              </button>
            ))}
          </div>
          <div className="mt-6 text-center">
            <p className="text-[11px] font-black text-stone-800 uppercase tracking-[0.3em]">{currentTrack.title}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
               <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
               <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">YouTube High Fidelity Stream</p>
               <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
            </div>
          </div>
        </div>
      )}

      <div className="relative group">
        {isOpen && (
          <div className="absolute inset-0 pointer-events-none">
            <span className="absolute bottom-full left-1/2 text-orange-500 text-sm animate-note-1 opacity-0">♪</span>
            <span className="absolute bottom-full left-1/4 text-stone-800 text-xs animate-note-2 opacity-0">♫</span>
            <span className="absolute bottom-full left-3/4 text-orange-400 text-lg animate-note-3 opacity-0">♭</span>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.2)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-4 border-white overflow-hidden relative ${isOpen ? 'bg-orange-500 text-white' : 'bg-stone-900 text-white'}`}
        >
          {isOpen && (
             <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          )}
          <div className={isOpen ? 'animate-spin-slow' : 'group-hover:rotate-12 transition-transform'}>
            {isOpen ? (
              <svg className="w-7 h-7 relative z-10" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1-1v4a1 1 0 102 0V8a1 1 0 00-1-1z" /></svg>
            ) : (
               <span className="text-2xl relative z-10">🎵</span>
            )}
          </div>
        </button>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes note-float-1 {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-80px) rotate(20deg); opacity: 0; }
        }
        @keyframes note-float-2 {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-60px) rotate(-30deg); opacity: 0; }
        }
        @keyframes note-float-3 {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-100px) rotate(10deg); opacity: 0; }
        }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
        .animate-note-1 { animation: note-float-1 3s ease-in infinite; }
        .animate-note-2 { animation: note-float-2 4s ease-in infinite 0.5s; }
        .animate-note-3 { animation: note-float-3 5s ease-in infinite 1s; }
      `}</style>
    </div>
  );
};

export default MusicPlayer;
