import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, 
  Square, 
  Send, 
  Languages, 
  MessageSquare, 
  User, 
  Volume2,
  AlertCircle,
  CheckCircle2,
  X
} from "lucide-react";
import { VoiceMessage, UserRole } from "../../types";
import { cn } from "../../lib/utils";

interface VoiceChatProps {
  incidentId: string;
  currentUserRole: UserRole;
  messages: VoiceMessage[];
  onSendMessage: (text: string, language: "en" | "lg") => void;
  onClose: () => void;
}

export default function VoiceChat({ incidentId, currentUserRole, messages, onSendMessage, onClose }: VoiceChatProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [inputText, setInputText] = useState("");
  const [language, setLanguage] = useState<"en" | "lg">("en");
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingTime > 0) {
        // Simulate transcription
        const mockTranscriptions = {
          en: ["I am on my way to the scene.", "Please stay calm, help is coming.", "I have arrived at the location."],
          lg: ["Ndi mu kkubo okujja.", "Mbeere mukkakkamu, obuyambi bujja.", "Ntuuse mu kifo."]
        };
        const randomText = mockTranscriptions[language][Math.floor(Math.random() * mockTranscriptions[language].length)];
        setInputText(randomText);
      }
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, language]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText, language);
      setInputText("");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[80vh]"
      >
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight uppercase">Emergency Voice Coordination</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Incident ID: {incidentId}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Translation Status */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Real-time Translation Active</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setLanguage("en")}
              className={cn(
                "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                language === "en" ? "bg-blue-600 text-white" : "bg-white text-slate-400 border border-slate-200"
              )}
            >
              English
            </button>
            <button 
              onClick={() => setLanguage("lg")}
              className={cn(
                "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                language === "lg" ? "bg-blue-600 text-white" : "bg-white text-slate-400 border border-slate-200"
              )}
            >
              Luganda
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
              <Mic className="w-12 h-12 mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[80%]",
                  msg.senderRole === currentUserRole ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{msg.senderRole}</span>
                  <span className="text-[9px] font-bold text-slate-300">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className={cn(
                  "p-4 rounded-2xl shadow-sm relative group",
                  msg.senderRole === currentUserRole 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white text-slate-900 border border-slate-100 rounded-tl-none"
                )}>
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  <div className="mt-2 flex items-center gap-2 opacity-60">
                    <Languages className="w-3 h-3" />
                    <p className="text-[10px] italic font-medium">
                      {msg.language === "en" ? "Translated from English" : "Translated from Luganda"}
                    </p>
                  </div>
                  <button className="absolute -right-8 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Volume2 className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="p-6 bg-white border-t border-slate-100 space-y-4">
          {isRecording && (
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="flex items-center gap-1 h-8">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [8, 24, 8] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                    className="w-1 bg-red-600 rounded-full"
                  />
                ))}
              </div>
              <span className="text-sm font-black text-red-600 tabular-nums">{formatTime(recordingTime)}</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            <button
              onMouseDown={() => setIsRecording(true)}
              onMouseUp={() => setIsRecording(false)}
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                isRecording ? "bg-red-600 text-white scale-110 shadow-red-200" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
              )}
            >
              {isRecording ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={isRecording ? "Recording transcription..." : "Type a message or hold mic..."}
                className="w-full pl-4 pr-12 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none font-bold text-sm"
              />
              <button 
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Push-to-talk enabled • Audit logging active</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
