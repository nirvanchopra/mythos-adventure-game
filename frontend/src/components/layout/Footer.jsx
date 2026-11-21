import React from 'react';
import { Sparkles, Shield, Terminal, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-purple-900/20 bg-[#07080d] py-6 px-4 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-purple-900/30 border border-purple-600/40 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-purple-400" />
          </div>
          <span className="font-semibold text-slate-300">Mythos Chronicles</span>
          <span>— Premium AI Interactive Multiplayer Gaming Platform</span>
        </div>

        <div className="flex items-center gap-6 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            FastAPI Engine Active
          </span>
          <span className="text-slate-400">LangChain LLM Connected</span>
          <span className="text-slate-400">WebSockets Ready</span>
        </div>
      </div>
    </footer>
  );
}
