import React from 'react';
import {
  Clapperboard,
  Brain,
  Search,
  Download,
  Wifi,
  Wand2,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react';
import { Card, Button, Badge } from './ui';

interface LandingProps {
  onEnter: () => void;
}

const features = [
  {
    icon: <LayoutGrid className="w-5 h-5 text-accent" />,
    title: 'PAO Matrix (00–99)',
    desc: 'Build your Person-Action-Object memory system across all 100 Major System numbers. Each slot anchors a character, an iconic action, and a signature object.',
  },
  {
    icon: <Wand2 className="w-5 h-5 text-accent" />,
    title: 'AI Casting Director',
    desc: 'Generate suggestions obeying strict Major System phonetic rules. Connects to Gemini, OpenAI, OpenRouter, and local Ollama models.',
  },
  {
    icon: <Search className="w-5 h-5 text-accent" />,
    title: 'Talent Scout',
    desc: 'Type any name — "Tony Stark", "Sun Wukong" — and immediately discover which Major System slots fit via initials or phonetic streams.',
  },
  {
    icon: <Brain className="w-5 h-5 text-accent" />,
    title: "Director's Cut",
    desc: 'Craft vivid, multi-sensory memory scenes linking character, action, and object for bulletproof retrieval during competition or study.',
  },
  {
    icon: <Download className="w-5 h-5 text-accent" />,
    title: 'Anki Export',
    desc: 'Export structured flashcard decks directly into Anki. Supports complete cards with phonetic hints or minimalist rapid-drill versions.',
  },
  {
    icon: <Wifi className="w-5 h-5 text-accent" />,
    title: 'Local-First Architecture',
    desc: 'Runs completely in your browser without mandatory accounts. LocalStorage persistence with optional Supabase cloud sync across devices.',
  },
];

const steps = [
  {
    num: '1',
    title: 'Learn the Phonetic Code',
    desc: 'Each digit 0–9 represents fixed consonant sounds. 0 is S/Z, 1 is T/D, 2 is N. Our interactive trainer cements the rules.',
  },
  {
    num: '2',
    title: 'Cast Your 100 Characters',
    desc: 'Assign characters, actions, and objects to 00–99. Use the Talent Scout to match real and fictional personalities.',
  },
  {
    num: '3',
    title: 'Drill with Spaced Repetition',
    desc: 'Generate Director’s Cut scenes and export your deck to Anki for automated, daily retrieval drills.',
  },
];

export const Landing: React.FC<LandingProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-canvas text-charcoal font-sans overflow-y-auto">
      {/* Hero */}
      <header className="relative py-16 sm:py-24 px-6 text-center border-b border-border bg-surface">
        <div className="max-w-4xl mx-auto space-y-6">
          <Badge variant="accent" size="md" className="gap-1.5 inline-flex">
            <Clapperboard className="w-3.5 h-3.5" /> Physical Index Card System for Memory Athletes
          </Badge>

          <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-charcoal">
            Direct Your Memory Palace
          </h1>

          <p className="text-base sm:text-lg text-steel max-w-2xl mx-auto leading-relaxed">
            MemoDirector is a local-first workstation to build, organize, and drill a{' '}
            <span className="font-semibold text-charcoal">Person-Action-Object (PAO)</span> memory
            deck using the <span className="font-semibold text-charcoal">Major System</span> phonetic
            code.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              variant="accent"
              size="lg"
              onClick={onEnter}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Open PAO Studio
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Features
            </Button>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16 sm:py-20 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-charcoal">
            Engineered for Precision Memorization
          </h2>
          <p className="text-steel text-sm max-w-lg mx-auto">
            Everything needed to eliminate ambiguity and construct a 100-card mnemonic matrix.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <Card
              key={i}
              variant="paper"
              padding="lg"
              className="hover:border-accent hover:shadow-md transition-all space-y-3"
            >
              <div className="p-2.5 rounded-lg bg-accent-light text-accent inline-block">
                {f.icon}
              </div>
              <h3 className="font-display font-bold text-charcoal text-base">{f.title}</h3>
              <p className="text-xs sm:text-sm text-steel leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="border-t border-border bg-surface-subtle/40 py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-charcoal">
              The 3-Step Mnemonic Pipeline
            </h2>
            <p className="text-steel text-sm">
              From phonetic basics to sub-conscious card recall.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <Card key={i} variant="paper" padding="md" className="space-y-2.5 text-left">
                <span className="font-display font-bold text-2xl text-accent block">
                  0{s.num}
                </span>
                <h4 className="font-semibold text-charcoal text-base">{s.title}</h4>
                <p className="text-xs text-steel leading-relaxed">{s.desc}</p>
              </Card>
            ))}
          </div>

          <div className="text-center pt-4">
            <Button variant="accent" size="lg" onClick={onEnter}>
              Launch MemoDirector Now
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
