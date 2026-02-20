import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)] film-grain">
      {/* Blueprint grid background */}
      <div className="fixed inset-0 blueprint-grid opacity-60 pointer-events-none" />

      {/* Warm accent glow — bottom corner */}
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-[var(--c-accent)] opacity-[0.03] blur-[150px] pointer-events-none" />

      {/* ========== NAV ========== */}
      <nav className="relative z-20 border-b border-[var(--c-border)]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 border border-[var(--c-accent)] flex items-center justify-center text-[var(--c-accent)] text-xs font-bold tracking-widest">
              FP
            </div>
            <span className="text-sm font-semibold tracking-wide hidden sm:block">FLOORPLAN</span>
          </Link>

          <div className="flex items-center gap-8">
            <span className="label-sm hidden md:block">AI · Architecture · Design</span>
            <Link href="/history" className="text-xs tracking-widest uppercase text-[var(--c-text-dim)] hover:text-[var(--c-accent)] transition-colors hidden sm:block">
              HISTORY
            </Link>
            <Link href="/generate">
              <button className="c-btn px-5 py-2.5 text-xs tracking-widest uppercase rounded-none flex items-center gap-2">
                START <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-12 gap-0 min-h-[85vh] items-end md:items-center">
          {/* Left — Big Type */}
          <div className="md:col-span-8 pt-20 md:pt-0">
            <div className="c-reveal">
              <p className="label-sm text-[var(--c-accent)] mb-6">AI Floor Plan Generator</p>
              <h1 className="heading-xl text-[var(--c-text)]">
                FROM<br />
                EXTERIOR<br />
                <span className="text-[var(--c-accent)]">TO BLUEPRINT</span>
              </h1>
            </div>
            <div className="c-reveal mt-10 max-w-md" style={{ animationDelay: '0.2s' }}>
              <p className="text-[var(--c-text-dim)] leading-relaxed">
                Upload any building photo. Our AI reads its architecture and generates a detailed, 
                labeled floor plan — rooms, dimensions, everything.
              </p>
            </div>
            <div className="c-reveal mt-10 flex items-center gap-6" style={{ animationDelay: '0.35s' }}>
              <Link href="/generate">
                <button className="c-btn px-8 py-4 text-sm tracking-widest uppercase rounded-none flex items-center gap-3 group">
                  GENERATE NOW
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <span className="arch-line" />
              <span className="label-sm">30 SEC PROCESSING</span>
            </div>
          </div>

          {/* Right — Vertical Info Strip */}
          <div className="md:col-span-4 flex flex-col items-end justify-center gap-12 py-20 md:py-0">
            <div className="c-reveal text-right" style={{ animationDelay: '0.3s' }}>
              <div className="label-sm mb-2">PRECISION</div>
              <div className="text-4xl font-bold text-[var(--c-accent)]">95%</div>
              <div className="text-xs text-[var(--c-text-muted)] mt-1">Spatial accuracy</div>
            </div>
            <div className="c-reveal text-right" style={{ animationDelay: '0.4s' }}>
              <div className="label-sm mb-2">LAYOUTS</div>
              <div className="text-4xl font-bold text-[var(--c-text)]">5+</div>
              <div className="text-xs text-[var(--c-text-muted)] mt-1">Distinct styles</div>
            </div>
            <div className="c-reveal text-right" style={{ animationDelay: '0.5s' }}>
              <div className="label-sm mb-2">SPEED</div>
              <div className="text-4xl font-bold text-[var(--c-text)]">&lt;30s</div>
              <div className="text-xs text-[var(--c-text-muted)] mt-1">Per generation</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== TICKER ========== */}
      <section className="relative z-10 border-y border-[var(--c-border)] overflow-hidden py-4 mt-4">
        <div className="ticker-track">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 whitespace-nowrap">
              {['FLOOR PLANS', 'AI POWERED', 'ROOM DETECTION', 'INSTANT EXPORT', 'ARCHITECTURE', 'LAYOUT GENERATION', 'SPATIAL ANALYSIS', 'BLUEPRINT'].map((text) => (
                <span key={`${i}-${text}`} className="flex items-center gap-8">
                  <span className="text-xs tracking-[0.3em] text-[var(--c-text-muted)] font-medium">{text}</span>
                  <span className="w-1.5 h-1.5 bg-[var(--c-accent)] rounded-full opacity-40" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ========== PROCESS ========== */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-32">
        <div className="grid md:grid-cols-12 gap-16 items-start">
          {/* Section Label */}
          <div className="md:col-span-4">
            <div className="c-reveal sticky top-32">
              <p className="label-sm text-[var(--c-accent)] mb-4">THE PROCESS</p>
              <h2 className="heading-lg text-[var(--c-text)]">
                Three steps.<br />
                <span className="text-[var(--c-text-dim)]">One result.</span>
              </h2>
              <div className="arch-line mt-6" />
            </div>
          </div>

          {/* Steps */}
          <div className="md:col-span-8 c-stagger">
            {[
              {
                num: '01',
                title: 'CAPTURE',
                desc: 'Upload a photograph of any building exterior — residential, commercial, any angle. Our system accepts JPG and PNG.',
              },
              {
                num: '02',
                title: 'ANALYZE',
                desc: 'The AI examines architectural features: windows, doors, roof structure, facade proportions. It maps these to internal spatial logic.',
              },
              {
                num: '03',
                title: 'GENERATE',
                desc: 'A complete floor plan is generated with labeled rooms, calculated areas, door placements, and a spatial consistency score.',
              },
            ].map((step) => (
              <div key={step.num} className="c-card p-8 md:p-10 flex gap-8 group cursor-default mb-4">
                <div className="text-5xl font-black text-[var(--c-accent)] opacity-20 group-hover:opacity-50 transition-opacity leading-none">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-wide mb-3 text-[var(--c-text)] group-hover:text-[var(--c-accent)] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[var(--c-text-dim)] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="relative z-10 border-y border-[var(--c-border)]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-24">
          <p className="label-sm text-[var(--c-accent)] mb-4 c-reveal">CAPABILITIES</p>
          <div className="grid md:grid-cols-4 gap-px bg-[var(--c-border)] c-stagger">
            {[
              { title: 'Standard Layout', desc: 'Traditional room arrangement with balanced proportions' },
              { title: 'Open Plan', desc: 'Modern connected living spaces with minimal walls' },
              { title: 'L-Shaped', desc: 'Wrap-around layouts for corner properties' },
              { title: 'Corridor Style', desc: 'Linear flow with central hallway distribution' },
            ].map((feat) => (
              <div key={feat.title} className="bg-[var(--c-surface)] p-8 group cursor-default hover:bg-[var(--c-surface-2)] transition-colors">
                <div className="w-8 h-px bg-[var(--c-accent)] mb-6 group-hover:w-16 transition-all duration-500" />
                <h3 className="text-sm font-bold tracking-wide mb-3 group-hover:text-[var(--c-accent)] transition-colors">{feat.title}</h3>
                <p className="text-xs text-[var(--c-text-dim)] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-32">
        <div className="c-reveal text-center">
          <p className="label-sm text-[var(--c-accent)] mb-6">GET STARTED</p>
          <h2 className="heading-lg mb-8">
            Ready to see your<br />
            <span className="text-[var(--c-accent)]">floor plan?</span>
          </h2>
          <Link href="/generate">
            <button className="c-btn px-12 py-5 text-sm tracking-widest uppercase rounded-none inline-flex items-center gap-3 group">
              BEGIN GENERATION
              <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          </Link>
          <p className="text-xs text-[var(--c-text-muted)] mt-8">No account required · Free to use · Instant results</p>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="relative z-10 border-t border-[var(--c-border)]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border border-[var(--c-accent)] flex items-center justify-center text-[var(--c-accent)] text-[8px] font-bold">
              FP
            </div>
            <span className="text-xs text-[var(--c-text-muted)]">FloorPlan AI © 2026</span>
          </div>
          <div className="flex gap-8">
            <span className="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-accent)] cursor-pointer transition-colors">GitHub</span>
            <span className="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-accent)] cursor-pointer transition-colors">About</span>
            <span className="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-accent)] cursor-pointer transition-colors">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
