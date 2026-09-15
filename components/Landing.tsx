import React from 'react';
import { Clapperboard, Brain, Search, BookOpen, Download, Wifi, Wand2, LayoutGrid } from 'lucide-react';

interface LandingProps {
  onEnter: () => void;
}

const features = [
  {
    icon: <LayoutGrid size={20} className="text-indigo-400" />,
    title: 'PAO Grid (00–99)',
    desc: 'Build your Person-Action-Object memory system across all 100 Major System numbers. Each slot maps a character, their iconic action, and a signature object.',
  },
  {
    icon: <Wand2 size={20} className="text-purple-400" />,
    title: 'AI Casting Director',
    desc: 'Let AI suggest PAO sets that follow strict Major System phonetic rules. Supports Gemini, OpenAI, OpenRouter, and local Ollama models.',
  },
  {
    icon: <Search size={20} className="text-amber-400" />,
    title: 'Talent Scout',
    desc: 'Type any name — "Tony Stark", "Sun Wukong" — and instantly see which Major System numbers they fit. Dual-mode: Initials + Phonetic.',
  },
  {
    icon: <Brain size={20} className="text-emerald-400" />,
    title: "Director's Cut",
    desc: 'AI generates vivid, multi-sensory memory scenes for each PAO set. Visual, auditory, and emotional anchors for stronger recall.',
  },
  {
    icon: <Download size={20} className="text-cyan-400" />,
    title: 'Anki Export',
    desc: 'Export your deck to Anki format for spaced repetition practice. Complete cards with phonetics, or minimalist quick-review versions.',
  },
  {
    icon: <Wifi size={20} className="text-rose-400" />,
    title: 'Offline-First',
    desc: 'All data stored locally on your device. Works completely offline. Optional cloud sync for multi-device access via Supabase.',
  },
];

const steps = [
  { num: '1', title: 'Learn the Major System', desc: 'Each digit 0–9 maps to consonant sounds. "S" = 0, "T" = 1, "N" = 2, and so on. Our built-in trainer teaches you the rules.' },
  { num: '2', title: 'Build your PAO deck', desc: 'Assign a Person, Action, and Object to each number 00–99. Use AI suggestions or the Talent Scout to find characters that match phonetically.' },
  { num: '3', title: 'Create memory scenes', desc: 'Generate vivid Director\'s Cut scenes that link the person, action, and object together. Export to Anki for daily spaced-repetition practice.' },
];

export const Landing: React.FC<LandingProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 overflow-y-auto">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-900 to-cyan-900/20" />
        <div className="relative max-w-4xl mx-auto px-6 py-20 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-6">
            <Clapperboard size={16} />
            Movie Studio for your Mind
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              MemoDirector
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            A specialized tool for memory athletes to build, visualize, and drill{' '}
            <strong className="text-slate-200">PAO (Person-Action-Object)</strong> memory systems
            using the <strong className="text-slate-200">Major System</strong> phonetic encoding.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onEnter}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 text-lg"
            >
              Launch App
            </button>
            <a
              href="#features"
              className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all border border-slate-700 text-lg"
            >
              Learn More
            </a>
          </div>
        </div>
      </header>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-12">
          Everything you need to master the Major System
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-all"
            >
              <div className="p-2 bg-slate-900 rounded-lg inline-block mb-4">
                {f.icon}
              </div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-slate-800">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-12">
          How it works
        </h2>
        <div className="space-y-8">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-5 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-xl font-black text-white shadow-lg shadow-indigo-500/20">
                {s.num}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg mb-1">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center border-t border-slate-800">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to build your memory palace?</h2>
        <p className="text-slate-400 mb-8">Start with example data or build from scratch. No sign-up required.</p>
        <button
          onClick={onEnter}
          className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 text-lg"
        >
          Launch App — It's Free
        </button>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-slate-800 text-xs text-slate-600">
        MemoDirector — Data stored locally on your device. No account required.
      </footer>
    </div>
  );
};
