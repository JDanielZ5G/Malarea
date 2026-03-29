import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  HeartPulse, 
  X, 
  ChevronRight, 
  Activity, 
  Wind, 
  Droplets,
  Info,
  BookOpen
} from "lucide-react";
import { FIRST_AID_CARDS } from "../../constants";
import { cn } from "../../lib/utils";

export default function FloatingFirstAid() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<typeof FIRST_AID_CARDS[0] | null>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "HeartPulse": return <HeartPulse className="w-5 h-5" />;
      case "Droplets": return <Droplets className="w-5 h-5" />;
      case "Activity": return <Activity className="w-5 h-5" />;
      case "Wind": return <Wind className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[70vh]"
          >
            <div className="p-5 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <h3 className="font-black text-sm uppercase tracking-tight">Emergency First Aid</h3>
              </div>
              <button 
                onClick={() => { setIsOpen(false); setSelectedCard(null); }}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedCard ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <button 
                    onClick={() => setSelectedCard(null)}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    <ChevronRight className="w-3 h-3 rotate-180" />
                    Back to List
                  </button>
                  
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                      {getIcon(selectedCard.icon)}
                    </div>
                    <h4 className="font-black text-slate-900 text-sm leading-tight">{selectedCard.title}</h4>
                  </div>

                  <div className="space-y-3">
                    {selectedCard.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-black text-slate-400">{idx + 1}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Common Solutions</p>
                  {FIRST_AID_CARDS.map(card => (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-blue-600 hover:bg-white transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {getIcon(card.icon)}
                        </div>
                        <span className="text-xs font-bold text-slate-700 text-left leading-tight">{card.title}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <p className="text-[9px] text-slate-400 font-medium leading-relaxed text-center">
                These instructions are for temporary guidance while responders are en route.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all",
          isOpen ? "bg-slate-900 text-white" : "bg-blue-600 text-white"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
        {!isOpen && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-lg">
            First Aid
          </span>
        )}
      </motion.button>
    </div>
  );
}
