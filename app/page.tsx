import Link from "next/link";
import { RunwayLogo } from "@/components/RunwayLogo";
import { ParallaxHero } from "@/components/ParallaxHero";
import { AnimatedHeroContent, AnimatedSection, IntegrationLogo } from "@/components/AnimatedLanding";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden hero-gradient">
      {/* Hero area: same background image behind header + content so nav has no separate background */}
      <div
        className="relative min-h-[80vh] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/hero-bg.png)" }}
      >
        <div className="absolute inset-0 bg-white/25 dark:bg-background-dark/40 pointer-events-none" aria-hidden />
        {/* ========== SHARED HEADER — transparent, sky shows through ========== */}
        <header className="sticky top-0 z-50 w-full border-b border-white/20 dark:border-white/10 bg-transparent px-6 md:px-10 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <div className="bg-primary p-1.5 rounded-lg text-white">
                <RunwayLogo className="size-6" />
              </div>
              <h2 className="text-[#111418] dark:text-white text-xl font-extrabold tracking-tight">
                Runway
              </h2>
            </Link>
            <nav className="hidden md:flex flex-1 justify-center gap-8">
              <Link className="text-[#111418] dark:text-gray-300 text-sm font-semibold hover:text-primary transition-colors" href="#execution">
                Product
              </Link>
              <Link className="text-[#111418] dark:text-gray-300 text-sm font-semibold hover:text-primary transition-colors" href="#features">
                Features
              </Link>
              <Link className="text-[#111418] dark:text-gray-300 text-sm font-semibold hover:text-primary transition-colors" href="#insights">
                Insights
              </Link>
              <Link className="text-[#111418] dark:text-gray-300 text-sm font-semibold hover:text-primary transition-colors" href="#ai">
                AI
              </Link>
              <Link className="text-[#111418] dark:text-gray-300 text-sm font-semibold hover:text-primary transition-colors" href="#trust">
                Trust
              </Link>
            </nav>
            <div className="flex gap-3">
              <Link
                href="/signup"
                className="hidden sm:flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold transition-all hover:bg-primary/90"
              >
                Try Runway free
              </Link>
              <Link
                href="/login"
                className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-[#f0f2f4] dark:bg-white/10 text-[#111418] dark:text-white text-sm font-bold transition-all hover:bg-gray-200 dark:hover:bg-white/20"
              >
                Login
              </Link>
            </div>
          </div>
        </header>

        {/* ========== 1. HERO (Stitch: hero_section) ========== */}
        <main className="relative text-center">
          <div className="relative max-w-[1200px] mx-auto px-6 pt-20 pb-12">
            <AnimatedHeroContent />

            {/* Dashboard mockup — full Dreelio-style: header + 4 metric cards + chart + quick actions */}
            <ParallaxHero className="mt-20 relative mx-auto max-w-5xl">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden dark:border-gray-700 dark:bg-background-dark">
                <div className="h-10 bg-gray-50 border-b border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 flex items-center px-4 gap-2">
                  <div className="size-3 rounded-full bg-red-400" />
                  <div className="size-3 rounded-full bg-yellow-400" />
                  <div className="size-3 rounded-full bg-green-400" />
                </div>
                <div className="flex h-[520px]">
                  <aside className="w-[200px] border-r border-gray-100 p-4 hidden md:flex flex-col dark:border-gray-800">
                    <div className="flex items-center gap-2 mb-8">
                      <div className="bg-primary p-1 rounded-lg text-white">
                        <RunwayLogo className="size-5" />
                      </div>
                      <span className="font-bold text-sm text-[#111418] dark:text-white">Runway</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-primary/10 text-primary">
                        <span className="material-symbols-outlined text-[18px]">dashboard</span>
                        <span className="text-sm font-semibold">Overview</span>
                      </div>
                      <div className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-500 dark:text-gray-400">
                        <span className="material-symbols-outlined text-[18px]">update</span>
                        <span className="text-sm font-medium">Sprints</span>
                      </div>
                      <div className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-500 dark:text-gray-400">
                        <span className="material-symbols-outlined text-[18px]">insights</span>
                        <span className="text-sm font-medium">Analytics</span>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </aside>
                  <div className="flex-1 p-6 text-left bg-[#f5f6f8] dark:bg-background-dark min-w-0">
                    {/* Header: welcome + search + icon buttons + avatar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-[#111418] dark:text-white">Welcome back, Founder</h3>
                        <p className="text-[#5f6368] dark:text-gray-400 text-sm">Your startup workspace</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="hidden sm:block h-9 w-40 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
                        <button type="button" className="size-9 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px] text-gray-500 dark:text-gray-400">insights</span>
                        </button>
                        <button type="button" className="size-9 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px] text-gray-500 dark:text-gray-400">analytics</span>
                        </button>
                        <div className="size-9 rounded-full bg-gray-200 dark:bg-gray-700" />
                      </div>
                    </div>
                    {/* Four metric cards with icons */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white dark:bg-[#1a2530] p-4 rounded-2xl shadow-sm border border-[#e8eaed] dark:border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-xl">task_alt</span>
                          </div>
                          <p className="text-xs font-medium text-[#5f6368] dark:text-gray-400">Tasks completed</p>
                        </div>
                        <p className="text-2xl font-extrabold text-[#111418] dark:text-white">24</p>
                        <p className="text-xs text-[#5f6368] dark:text-gray-500">This sprint</p>
                      </div>
                      <div className="bg-white dark:bg-[#1a2530] p-4 rounded-2xl shadow-sm border border-[#e8eaed] dark:border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-xl">flag</span>
                          </div>
                          <p className="text-xs font-medium text-[#5f6368] dark:text-gray-400">Milestones</p>
                        </div>
                        <p className="text-2xl font-extrabold text-primary">3</p>
                        <p className="text-xs text-[#5f6368] dark:text-gray-500">Startup workspaces</p>
                      </div>
                      <div className="bg-white dark:bg-[#1a2530] p-4 rounded-2xl shadow-sm border border-[#e8eaed] dark:border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-xl">update</span>
                          </div>
                          <p className="text-xs font-medium text-[#5f6368] dark:text-gray-400">Sprint progress</p>
                        </div>
                        <p className="text-2xl font-extrabold text-[#111418] dark:text-white">2</p>
                        <p className="text-xs text-[#5f6368] dark:text-gray-500">Active sprints</p>
                      </div>
                      <div className="bg-white dark:bg-[#1a2530] p-4 rounded-2xl shadow-sm border border-[#e8eaed] dark:border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-xl">rate_review</span>
                          </div>
                          <p className="text-xs font-medium text-[#5f6368] dark:text-gray-400">Validation entries</p>
                        </div>
                        <p className="text-2xl font-extrabold text-[#111418] dark:text-white">8</p>
                        <p className="text-xs text-[#5f6368] dark:text-gray-500">Recent</p>
                      </div>
                    </div>
                    {/* Chart + Quick actions row */}
                    <div className="flex gap-4 flex-1 min-h-0">
                      <div className="flex-1 min-w-0 bg-white dark:bg-[#1a2530] p-4 rounded-2xl shadow-sm border border-[#e8eaed] dark:border-white/5 flex flex-col">
                        <div className="flex justify-between items-end mb-4">
                          <p className="text-sm font-semibold text-[#111418] dark:text-white">Execution over time</p>
                          <span className="text-xs text-[#5f6368] dark:text-gray-400">Past 6 sprints</span>
                        </div>
                        <div className="flex items-end justify-between gap-2 flex-1 min-h-[100px]">
                          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-t min-h-[20%] h-1/3" />
                          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-t min-h-[20%] h-1/2" />
                          <div className="flex-1 bg-primary rounded-t min-h-[20%] h-3/4" />
                          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-t min-h-[20%] h-2/3" />
                          <div className="flex-1 bg-primary/40 rounded-t min-h-[20%] h-5/6" />
                          <div className="flex-1 bg-primary rounded-t min-h-[20%] h-full" />
                        </div>
                      </div>
                      <div className="w-[180px] shrink-0 grid grid-cols-2 gap-2">
                        <div className="bg-white dark:bg-[#1a2530] p-3 rounded-xl border border-[#e8eaed] dark:border-white/5 shadow-sm flex flex-col items-center justify-center gap-1 text-center">
                          <span className="material-symbols-outlined text-primary text-2xl">play_circle</span>
                          <span className="text-[10px] font-semibold text-[#111418] dark:text-white">New sprint</span>
                        </div>
                        <div className="bg-white dark:bg-[#1a2530] p-3 rounded-xl border border-[#e8eaed] dark:border-white/5 shadow-sm flex flex-col items-center justify-center gap-1 text-center">
                          <span className="material-symbols-outlined text-primary text-2xl">flag</span>
                          <span className="text-[10px] font-semibold text-[#111418] dark:text-white">Add milestone</span>
                        </div>
                        <div className="bg-white dark:bg-[#1a2530] p-3 rounded-xl border border-[#e8eaed] dark:border-white/5 shadow-sm flex flex-col items-center justify-center gap-1 text-center">
                          <span className="material-symbols-outlined text-primary text-2xl">add_task</span>
                          <span className="text-[10px] font-semibold text-[#111418] dark:text-white">Add task</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ParallaxHero>

            {/* Integrations */}
            <section className="max-w-[1200px] mx-auto px-6 py-20">
              <AnimatedSection delay={0}>
                <h4 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#5f6368] dark:text-gray-400 mb-12">
                  Use your favourite integrations
                </h4>
              </AnimatedSection>
              <div className="flex flex-wrap justify-center items-center gap-10 lg:gap-16">
                <IntegrationLogo icon="hub" name="Slack" delay={100} />
                <IntegrationLogo icon="task_alt" name="Jira" delay={200} />
                <IntegrationLogo icon="videocam" name="Loom" delay={300} />
                <IntegrationLogo icon="code" name="GitHub" delay={400} />
                <IntegrationLogo icon="description" name="Notion" delay={500} />
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* ========== 2. EXECUTION SECTION (Stitch: execution_section) ========== */}
      <section id="execution" className="bg-background-light dark:bg-background-dark border-t border-[#f0f2f4] dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/5 dark:bg-primary/10 rounded-3xl -z-10 transition-transform group-hover:scale-[1.02]" />
              <div className="bg-white dark:bg-[#1a2530] border border-gray-100 dark:border-white/5 rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                  <h3 className="font-bold text-lg">Startup workspace</h3>
                  <div className="flex gap-2">
                    <span className="size-3 rounded-full bg-red-400" />
                    <span className="size-3 rounded-full bg-yellow-400" />
                    <span className="size-3 rounded-full bg-green-400" />
                  </div>
                </div>
                <div className="px-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                  <div className="flex gap-6">
                    <span className="border-b-2 border-primary text-primary py-4 text-sm font-bold">Ongoing</span>
                    <span className="border-b-2 border-transparent text-gray-500 dark:text-gray-400 py-4 text-sm font-bold">In Review</span>
                    <span className="border-b-2 border-transparent text-gray-500 dark:text-gray-400 py-4 text-sm font-bold">Completed</span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-background-dark hover:border-primary/30 transition-colors shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">rocket_launch</span>
                      </div>
                      <div>
                        <p className="font-bold text-[#111418] dark:text-white">Alpha launch prep</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">MVP Milestone</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold">High Priority</span>
                      <div className="size-6 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[16px]">check</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-background-dark hover:border-primary/30 transition-colors shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">groups</span>
                      </div>
                      <div>
                        <p className="font-bold text-[#111418] dark:text-white">Customer discovery</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Validation</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">Active</span>
                      <div className="size-6 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[16px]">check</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-background-dark opacity-50 grayscale hover:grayscale-0 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">analytics</span>
                      </div>
                      <div>
                        <p className="font-bold">Sprint analytics</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Execution metrics</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 hidden xl:block p-4 bg-white dark:bg-[#1a2530] border border-gray-100 dark:border-white/5 rounded-xl shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">verified</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Execution</p>
                    <p className="text-xs font-bold">Tracked &amp; Verified</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-8">
              <div className="space-y-4">
                <p className="text-primary font-extrabold text-sm tracking-[0.2em] uppercase">Execution Management</p>
                <h2 className="text-[#111418] dark:text-white text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
                  Plan, track and move your startup forward
                </h2>
                <p className="text-lg text-[#617589] dark:text-gray-400 leading-relaxed max-w-[540px]">
                  Stay organized and move faster with structured workspaces designed for high-growth startups. Manage your entire execution pipeline with AI-powered insights and verifiable blockchain milestones.
                </p>
              </div>
              <div className="flex flex-col gap-10">
                <Link
                  href="/signup"
                  className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-lg h-14 px-8 bg-[#111418] dark:bg-white text-white dark:text-[#111418] text-lg font-bold transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95"
                >
                  Try Runway free
                </Link>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-white/5 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">checklist</span>
                    </div>
                    <span className="font-bold text-sm">Tasks</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-white/5 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">update</span>
                    </div>
                    <span className="font-bold text-sm">Weekly Tracking</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-white/5 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">reviews</span>
                    </div>
                    <span className="font-bold text-sm">Validation feedback</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-white/5 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">insights</span>
                    </div>
                    <span className="font-bold text-sm">Progress Analytics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 3. FEATURES GRID (Stitch: features_grid) ========== */}
      <section id="features" className="flex-1 bg-[#f8fafb] dark:bg-[#0f1419]">
        <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
          <div className="text-center mb-16">
            <span className="text-primary font-bold text-sm tracking-[0.2em] uppercase mb-4 block">Capabilities</span>
            <h2 className="text-[#111418] dark:text-white text-4xl md:text-5xl font-extrabold leading-tight tracking-[-0.02em]">
              Built for early stage founders
            </h2>
            <p className="mt-4 text-[#617589] dark:text-slate-400 text-lg max-w-2xl mx-auto">
              The execution layer for your startup. From seed to scale, manage every milestone with a clear audit trail and structured tracking.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-[#dbe0e6] dark:border-slate-800 p-8 flex flex-col justify-between group hover:shadow-xl transition-all duration-300">
              <div className="mb-8">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary">timeline</span>
                </div>
                <h3 className="text-[#111418] dark:text-white text-2xl font-bold mb-3">Execution &amp; milestone tracking</h3>
                <p className="text-[#617589] dark:text-slate-400">Track every detail from MVP to scale with automated status reporting and AI forecasting.</p>
              </div>
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-[#f0f2f4] dark:border-slate-700 bg-gray-50 dark:bg-slate-950 p-4 shadow-inner">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded border border-gray-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm font-bold">Phase 1: MVP Design</span>
                    </div>
                    <span className="px-2 py-1 text-[10px] bg-primary/10 text-primary font-bold rounded uppercase">Completed</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded border border-gray-100 dark:border-slate-800 shadow-sm ring-2 ring-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-sm font-bold">Phase 2: Alpha Launch</span>
                    </div>
                    <span className="px-2 py-1 text-[10px] bg-primary text-white font-bold rounded uppercase">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded border border-gray-100 dark:border-slate-800 shadow-sm opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-sm font-bold">Phase 3: Beta Scale</span>
                    </div>
                    <span className="px-2 py-1 text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-500 font-bold rounded uppercase">Upcoming</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-[#dbe0e6] dark:border-slate-800 p-8 flex flex-col justify-between group hover:shadow-xl transition-all duration-300">
              <div className="mb-8">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary">hub</span>
                </div>
                <h3 className="text-[#111418] dark:text-white text-2xl font-bold mb-3">Integrates seamlessly</h3>
                <p className="text-[#617589] dark:text-slate-400">Connect your favorite tools. From Slack and Jira to Loom and GitHub, stay in sync without switching tabs.</p>
              </div>
              <div className="grid grid-cols-4 gap-4 md:gap-6 p-4 bg-[#f6f7f8] dark:bg-slate-950 rounded-lg h-full max-h-[280px] content-center items-center justify-items-center">
                <div className="size-10 md:size-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer"><span className="material-symbols-outlined text-blue-500">alternate_email</span></div>
                <div className="size-10 md:size-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer"><span className="material-symbols-outlined text-blue-600">terminal</span></div>
                <div className="size-10 md:size-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer"><span className="material-symbols-outlined text-orange-500">inventory_2</span></div>
                <div className="size-10 md:size-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer"><span className="material-symbols-outlined text-indigo-500">description</span></div>
                <div className="size-10 md:size-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer"><span className="material-symbols-outlined text-red-500">chat</span></div>
                <div className="size-10 md:size-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer"><span className="material-symbols-outlined text-green-500">videocam</span></div>
                <div className="size-10 md:size-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer"><span className="material-symbols-outlined text-purple-500">account_tree</span></div>
                <div className="size-10 md:size-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer"><span className="material-symbols-outlined text-blue-400">code</span></div>
                <div className="size-10 md:size-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer"><span className="material-symbols-outlined text-gray-800">grid_view</span></div>
                <div className="size-10 md:size-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer"><span className="material-symbols-outlined text-yellow-600">task_alt</span></div>
                <div className="size-10 md:size-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer"><span className="material-symbols-outlined text-pink-500">stream</span></div>
                <div className="size-10 md:size-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer"><span className="material-symbols-outlined text-cyan-600">cloud_upload</span></div>
              </div>
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-[#dbe0e6] dark:border-slate-800 p-6 group hover:-translate-y-1 transition-all duration-300">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary">handshake</span>
              </div>
              <h4 className="text-[#111418] dark:text-white text-lg font-bold mb-2">Team roles</h4>
              <p className="text-[#617589] dark:text-slate-400 text-sm leading-relaxed">
                Precise governance with role-based access control. On-chain accountability for critical decisions.
              </p>
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-[#dbe0e6] dark:border-slate-800 p-6 group hover:-translate-y-1 transition-all duration-300">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary">language</span>
              </div>
              <h4 className="text-[#111418] dark:text-white text-lg font-bold mb-2">Progress</h4>
              <p className="text-[#617589] dark:text-slate-400 text-sm leading-relaxed">
                Monitor global milestones in real-time. Transparent metrics for investors and internal stakeholders.
              </p>
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-[#dbe0e6] dark:border-slate-800 p-6 group hover:-translate-y-1 transition-all duration-300">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary">view_quilt</span>
              </div>
              <h4 className="text-[#111418] dark:text-white text-lg font-bold mb-2">View things your way</h4>
              <p className="text-[#617589] dark:text-slate-400 text-sm leading-relaxed">
                Custom layouts from Kanban to Gantt. Dynamic views that adapt to your team&apos;s specific workflow.
              </p>
            </div>
          </div>
          <div className="mt-20 p-10 bg-primary rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8 text-white">
            <div>
              <h2 className="text-3xl font-extrabold mb-2">Ready to accelerate your runway?</h2>
              <p className="text-primary/20 text-white/80">Join 500+ startups building the future on our platform.</p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <Link href="/signup" className="bg-white text-primary px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition-colors w-full md:w-auto text-center">Get Started Free</Link>
              <Link href="#trust" className="bg-primary/20 border border-white/30 text-white px-8 py-4 rounded-lg font-bold hover:bg-primary/30 transition-colors w-full md:w-auto text-center">Request Demo</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 4. INSIGHTS SECTION (Stitch: insights_section) ========== */}
      <section id="insights" className="bg-background-light dark:bg-background-dark border-t border-[#f0f2f4] dark:border-white/10">
        <div className="px-4 md:px-20 lg:px-40 flex flex-1 justify-center py-12 md:py-24">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center max-w-[1200px] flex-1">
            <div className="flex flex-col flex-1 gap-8 order-2 lg:order-1">
              <div className="flex flex-col gap-4">
                <span className="text-primary text-sm font-bold tracking-widest uppercase">Progress &amp; Insights</span>
                <h2 className="text-[#111418] dark:text-white tracking-tight text-[32px] md:text-[44px] font-extrabold leading-tight lg:max-w-[500px]">
                  Understand what&apos;s working and what isn&apos;t
                </h2>
                <p className="text-[#617589] dark:text-gray-400 text-lg font-normal leading-relaxed lg:max-w-[520px]">
                  Get clear indicators of your startup&apos;s health and spot risks before they scale with our AI-driven insights layer. Monitor every milestone with blockchain-verified precision.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="flex min-w-[200px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-6 bg-[#111418] dark:bg-primary text-white text-base font-bold leading-normal transition-all hover:bg-opacity-90 active:scale-95 shadow-lg w-fit"
              >
                View analytics dashboard
              </Link>
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full bg-white dark:bg-[#1c2a38] px-5 border border-[#dbe0e6] dark:border-gray-700 shadow-sm hover:border-primary cursor-default">
                  <span className="material-symbols-outlined text-primary text-[20px]">task_alt</span>
                  <p className="text-[#111418] dark:text-gray-200 text-sm font-semibold">Tasks Completed</p>
                </div>
                <div className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full bg-white dark:bg-[#1c2a38] px-5 border border-[#dbe0e6] dark:border-gray-700 shadow-sm hover:border-primary cursor-default">
                  <span className="material-symbols-outlined text-primary text-[20px]">trending_up</span>
                  <p className="text-[#111418] dark:text-gray-200 text-sm font-semibold">Sprint Reliability</p>
                </div>
                <div className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full bg-white dark:bg-[#1c2a38] px-5 border border-[#dbe0e6] dark:border-gray-700 shadow-sm hover:border-primary cursor-default">
                  <span className="material-symbols-outlined text-primary text-[20px]">insights</span>
                  <p className="text-[#111418] dark:text-gray-200 text-sm font-semibold">Milestones</p>
                </div>
                <div className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full bg-white dark:bg-[#1c2a38] px-5 border border-[#dbe0e6] dark:border-gray-700 shadow-sm hover:border-primary cursor-default">
                  <span className="material-symbols-outlined text-primary text-[20px]">hub</span>
                  <p className="text-[#111418] dark:text-gray-200 text-sm font-semibold">Integrations</p>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full max-w-[560px] order-1 lg:order-2">
              <div className="relative bg-primary/10 dark:bg-primary/5 rounded-[2rem] p-4 md:p-8">
                <div className="bg-white dark:bg-[#16222e] rounded-2xl shadow-2xl p-6 flex flex-col gap-8 border border-white dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[#111418] dark:text-white text-lg font-bold">Execution progress</h3>
                    <div className="flex gap-2">
                      <div className="size-2 rounded-full bg-[#e2e8f0] dark:bg-gray-700" />
                      <div className="size-2 rounded-full bg-primary" />
                      <div className="size-2 rounded-full bg-[#e2e8f0] dark:bg-gray-700" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-[#617589] dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">Tasks</p>
                      <p className="text-[#111418] dark:text-white text-xl font-extrabold">84%</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[#617589] dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">Milestones</p>
                      <p className="text-[#111418] dark:text-white text-xl font-extrabold">12/15</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[#617589] dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">Blocked</p>
                      <p className="text-red-500 text-xl font-extrabold">2</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[#617589] dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">Score</p>
                      <p className="text-primary text-xl font-extrabold">9.2</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[#617589] dark:text-gray-400 text-sm font-medium">Execution vs plan</p>
                        <p className="text-[#111418] dark:text-white text-2xl font-bold">Sprint 6</p>
                      </div>
                      <div className="flex items-center gap-1 text-[#078838] bg-[#078838]/10 px-2 py-0.5 rounded-lg">
                        <span className="material-symbols-outlined text-[16px] font-bold">trending_up</span>
                        <span className="text-xs font-bold">+12.5%</span>
                      </div>
                    </div>
                    <div className="h-24 w-full flex items-end justify-between gap-1">
                      <div className="w-full bg-primary/30 rounded-t min-h-[20%] h-1/3" />
                      <div className="w-full bg-primary/50 rounded-t min-h-[20%] h-1/2" />
                      <div className="w-full bg-primary rounded-t min-h-[20%] h-3/4" />
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t min-h-[20%] h-2/3" />
                      <div className="w-full bg-primary/70 rounded-t min-h-[20%] h-5/6" />
                      <div className="w-full bg-primary rounded-t min-h-[20%] h-full" />
                    </div>
                    <div className="flex justify-between mt-2 px-1 text-[10px] font-bold text-[#94a3b8] uppercase">
                      <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-[#f0f2f4] dark:border-gray-800 flex justify-between items-center">
                    <div className="flex -space-x-2">
                      <div className="size-7 rounded-full bg-slate-200 dark:bg-gray-700 border-2 border-white dark:border-[#16222e]" />
                      <div className="size-7 rounded-full bg-slate-200 dark:bg-gray-700 border-2 border-white dark:border-[#16222e]" />
                      <div className="size-7 rounded-full bg-primary border-2 border-white dark:border-[#16222e] flex items-center justify-center">
                        <span className="text-[10px] text-white font-bold">+4</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[#617589] dark:text-gray-400 text-sm">history</span>
                      <span className="text-[#617589] dark:text-gray-400 text-xs">Updated 2m ago</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 md:-left-12 bg-white dark:bg-[#1c2a38] border border-red-100 dark:border-red-900 shadow-xl rounded-xl p-4 flex items-center gap-4 max-w-[200px]">
                  <div className="size-10 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600">
                    <span className="material-symbols-outlined">warning</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight">Risk Detected</p>
                    <p className="text-xs font-semibold text-[#111418] dark:text-white">Runway Gap High</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 5. Insights / Smart summaries ========== */}
      <section id="ai" className="bg-[#f8fafb] dark:bg-[#0f1419] border-t border-gray-200/50 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#111418] dark:text-white sm:text-4xl max-w-2xl">
              See what’s stuck. Summarize feedback. Update investors.
            </h2>
            <p className="mt-4 text-base text-[#5f6368] dark:text-gray-400 max-w-xl">
              Runway turns your sprint and validation data into clear signals—no buzzwords, no dashboards you’ll never open.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#e8eaed] dark:border-white/10 bg-white dark:bg-[#161d26] p-6 sm:p-7">
              <span className="inline-block text-2xl font-bold tabular-nums text-primary/80">01</span>
              <h3 className="mt-4 text-lg font-semibold text-[#111418] dark:text-white">Execution health</h3>
              <p className="mt-2 text-sm text-[#5f6368] dark:text-gray-400 leading-relaxed">
                Spot stalled milestones and repeated blockers from your task and sprint history. Get a straight read on where things actually stand.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e8eaed] dark:border-white/10 bg-white dark:bg-[#161d26] p-6 sm:p-7">
              <span className="inline-block text-2xl font-bold tabular-nums text-primary/80">02</span>
              <h3 className="mt-4 text-lg font-semibold text-[#111418] dark:text-white">Feedback, distilled</h3>
              <p className="mt-2 text-sm text-[#5f6368] dark:text-gray-400 leading-relaxed">
                Interviews and validation notes summarized into trends and weak assumptions. Turn raw input into concrete next steps.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e8eaed] dark:border-white/10 bg-white dark:bg-[#161d26] p-6 sm:p-7">
              <span className="inline-block text-2xl font-bold tabular-nums text-primary/80">03</span>
              <h3 className="mt-4 text-lg font-semibold text-[#111418] dark:text-white">Stakeholder one-pagers</h3>
              <p className="mt-2 text-sm text-[#5f6368] dark:text-gray-400 leading-relaxed">
                One structured snapshot: problem, progress, validation, roadmap. Share with investors or leadership without rewriting decks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 6. FINAL CTA ========== */}
      <section id="trust" className="bg-background-light dark:bg-background-dark border-t border-[#dbe0e6] dark:border-[#2d3945]">
        <section className="bg-[#111418] dark:bg-black text-white py-24 px-4 overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none trust-grid" />
          <div className="max-w-[800px] mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
              Give your startup a real Runway
            </h2>
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-[600px] mx-auto">
              Stop assuming progress. Start proving it. Join 500+ high-growth teams managing execution with cryptographic certainty.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="w-full sm:w-auto min-w-[200px] bg-white text-black h-14 rounded-lg text-lg font-bold hover:bg-gray-200 transition-all flex items-center justify-center">
                Try Runway free
              </Link>
              <Link href="#trust" className="w-full sm:w-auto min-w-[200px] border border-white/20 h-14 rounded-lg text-lg font-bold hover:bg-white/10 transition-all flex items-center justify-center">
                Contact Sales
              </Link>
            </div>
            <p className="mt-8 text-sm text-gray-500">No credit card required. 14-day free trial.</p>
          </div>
        </section>
      </section>

      {/* ========== FULL FOOTER (Stitch: trust_&_final_cta footer) ========== */}
      <footer className="bg-white dark:bg-background-dark border-t border-[#dbe0e6] dark:border-[#2d3945] pt-16 pb-8 px-10">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="size-6 text-primary">
                <RunwayLogo className="size-6" />
              </div>
              <h2 className="text-lg font-bold text-[#111418] dark:text-white">Runway</h2>
            </div>
            <p className="text-sm text-[#617589] dark:text-gray-500 leading-relaxed">
              The ultimate execution engine for modern startups.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-[#111418] dark:text-white">Product</h4>
            <ul className="flex flex-col gap-4 text-sm text-[#617589] dark:text-gray-400">
              <li><Link className="hover:text-primary transition-colors" href="#features">Features</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/dashboard">Dashboard</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/upgrade">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-[#111418] dark:text-white">Resources</h4>
            <ul className="flex flex-col gap-4 text-sm text-[#617589] dark:text-gray-400">
              <li><a className="hover:text-primary transition-colors" href="#">Documentation</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-[#111418] dark:text-white">Company</h4>
            <ul className="flex flex-col gap-4 text-sm text-[#617589] dark:text-gray-400">
              <li><a className="hover:text-primary transition-colors" href="#">About Us</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Privacy</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Terms</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-[#111418] dark:text-white">Connect</h4>
            <div className="flex gap-4">
              <a className="text-[#617589] hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">share</span></a>
              <a className="text-[#617589] hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">public</span></a>
              <a className="text-[#617589] hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">chat</span></a>
            </div>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center border-t border-[#f0f2f4] dark:border-[#2d3945] pt-8 gap-4">
          <p className="text-xs text-[#617589] dark:text-gray-500">
            © 2024 Runway Inc. All rights reserved. Built with precision for innovators.
          </p>
          <div className="flex gap-6">
            <Link className="text-xs text-[#617589] hover:text-primary" href="#">Status</Link>
            <Link className="text-xs text-[#617589] hover:text-primary" href="#">Cookies</Link>
            <Link className="text-xs text-[#617589] hover:text-primary" href="#">Sitemap</Link>
          </div>
        </div>
      </footer>

      {/* Background decoration (Stitch hero) */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-full -z-50 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-primary/10 blur-[100px] rounded-full" />
      </div>
    </div>
  );
}
