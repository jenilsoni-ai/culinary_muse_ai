
import React, { useState, useRef, useEffect } from 'react';
import { Modality, LiveServerMessage } from '@google/genai';
import { getAI, encodeBase64, decodeBase64, decodeAudioData } from '../services/geminiService';

const HealthCoachWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    inputCtxRef.current?.close();
    outputCtxRef.current?.close();
    activeSourcesRef.current.forEach(s => s.stop());
    activeSourcesRef.current.clear();
    setIsActive(false);
    setIsSpeaking(false);
  };

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = getAI();
      
      inputCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: 'You are a warm, knowledgeable health and nutrition coach for home cooks. Provide brief, science-based health tips and encouragement. Keep responses concise for voice conversation.'
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            const source = inputCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputCtxRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ 
                  media: { data: encodeBase64(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } 
                });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtxRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64 && outputCtxRef.current) {
              setIsSpeaking(true);
              const audioBuffer = await decodeAudioData(decodeBase64(base64), outputCtxRef.current, 24000, 1);
              const source = outputCtxRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtxRef.current.destination);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtxRef.current.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              
              activeSourcesRef.current.add(source);
              source.onended = () => {
                activeSourcesRef.current.delete(source);
                if (activeSourcesRef.current.size === 0) setIsSpeaking(false);
              };
            }

            if (msg.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => s.stop());
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          }
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Live session failed", err);
      stopSession();
    }
  };

  useEffect(() => () => stopSession(), []);

  return (
    <div className="fixed bottom-[8.5rem] left-6 z-[60] flex flex-col items-start gap-4">
      {isOpen && (
        <div className="bg-stone-900 text-white rounded-[2.5rem] shadow-2xl border border-white/5 p-8 w-[360px] animate-in slide-in-from-bottom-10 duration-500 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-xl">🥗</div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Health Coach</span>
                <p className="text-[8px] text-stone-500 font-bold uppercase tracking-tighter">Voice-to-Voice Optimization</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="bg-white/5 p-2 rounded-xl hover:bg-white/10 transition-all">✕</button>
          </div>

          <div className="relative h-48 rounded-[2rem] bg-stone-800/50 border border-white/5 flex items-center justify-center overflow-hidden mb-6">
            <div className={`absolute inset-0 bg-emerald-500/10 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
            {isActive ? (
              <div className="flex items-center gap-1">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1 bg-emerald-400 rounded-full transition-all duration-300 ${isSpeaking ? 'animate-pulse' : ''}`}
                    style={{ height: `${Math.random() * (isSpeaking ? 60 : 20) + 10}px`, opacity: isActive ? 1 : 0.2 }}
                  ></div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Session Offline</p>
            )}
          </div>

          <button
            onClick={isActive ? stopSession : startSession}
            className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
          >
            {isActive ? "End Health Session" : "Connect to Coach"}
          </button>
          
          <p className="mt-6 text-[9px] text-stone-500 text-center leading-relaxed font-medium">
            "Your body is the primary kitchen. Feed it with mindful ingredients."
          </p>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-4 border-white overflow-hidden relative ${isOpen ? 'bg-emerald-500' : 'bg-stone-800 text-white'}`}
      >
        <span className="text-2xl relative z-10">{isOpen ? '🧘‍♂️' : '🍏'}</span>
        {isActive && (
          <div className="absolute inset-0 bg-emerald-400/30 animate-ping"></div>
        )}
      </button>
    </div>
  );
};

export default HealthCoachWidget;
