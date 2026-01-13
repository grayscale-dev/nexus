import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import BetaAccessModal from '@/components/common/BetaAccessModal';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const features = [
  {
    id: 'feedback-management',
    title: 'Feedback Management',
    description:
      'Collect, categorize, and prioritize feedback with rich metadata, tags, and visibility controls. Keep signal high and responses fast.',
    bullets: [
      'Public or private feedback boards',
      'Tagging, status flows, and ownership',
      'Attach screenshots and files',
    ],
    image:
      'feedback-page.png',
  },
  {
    id: 'product-roadmap',
    title: 'Product Roadmap',
    description:
      'Share what is planned, in progress, and shipped with a clean, public-facing roadmap. Keep internal context connected to user demand.',
    bullets: [
      'Kanban-style planning',
      'Status updates and progress notes',
      'Link feedback to roadmap items',
    ],
    image:
      'roadmap.png',
  },
  {
    id: 'changelog',
    title: 'Changelog',
    description:
      'Celebrate shipped work and keep customers in the loop with a polished changelog that is easy to scan and share.',
    bullets: [
      'Release notes with tags',
      'Visibility controls (public/internal)',
      'Link updates back to roadmap items',
    ],
    image:
      'changelog.png',
  },
  {
    id: 'documentation',
    title: 'Documentation',
    description:
      'Author docs and tutorials with built-in feedback loops so the right improvements bubble up quickly.',
    bullets: [
      'Hierarchical doc pages',
      'Comments and questions',
      'Markdown + rich content',
    ],
    image:
      'docs-page.png',
  },
  {
    id: 'support-threads',
    title: 'Support Threads',
    description:
      'Keep support conversations organized and searchable. Give users a clear path to resolution without losing context.',
    bullets: [
      'Private tickets with status + priority',
      'Internal notes for staff',
      'Attach files to replies',
    ],
    image:
      'support-inbox.png',
  },
  {
    id: 'workflow-automation',
    title: 'Workflow Automation',
    description:
      'Connect feedback, roadmap, docs, and support so every team works from the same source of truth.',
    bullets: [
      'Cross-link entities with shared IDs',
      'Unified board permissions',
      'Analytics-ready event tracking',
    ],
    image:
      'workflow-auto.png',
  },
];

export default function Features() {
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  const location = useLocation();

  useEffect(() => {
    document.title = 'base25 - Features';
  }, []);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    if (!id) return;

    const handle = setTimeout(() => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);

    return () => clearTimeout(handle);
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-x-hidden" id="top">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-cyan-200/40 blur-3xl" />
      </div>
      <PublicHeader currentPage="Features" onRequestAccess={() => setShowBetaModal(true)} />

      <main className="bg-[#F8FAFC] relative z-0">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="absolute top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-cyan-200/40 blur-3xl" />
        </div>
        <div className="relative z-10">
        <section className="px-6 py-16">
          <div className="max-w-5xl mx-auto text-center space-y-6 relative">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">
              Features
            </p>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900">
              Everything{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-cyan-500">
                base25
              </span>{' '}
              ships for modern product teams
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Each feature connects back to customer conversations.
            </p>
          </div>
        </section>

        <section className="px-6 pb-12">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.18em]">
                Jump to
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {features.map((feature) => (
                  <a
                    key={feature.id}
                    href={`#${feature.id}`}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:border-slate-300 hover:text-slate-900"
                  >
                    {feature.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto space-y-24">
            {features.map((feature, index) => (
              <div
                key={feature.id}
                id={feature.id}
                className={`scroll-mt-28 grid lg:grid-cols-2 gap-12 items-center rounded-3xl border border-slate-200 bg-white p-8 shadow-sm ${
                  index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.18em]">
                    {feature.title}
                  </p>
                  <h2 className="text-3xl font-bold text-slate-900 mt-3">
                    {feature.title}
                  </h2>
                  <p className="text-slate-600 mt-4 text-lg">
                    {feature.description}
                  </p>
                  <div className="mt-6" />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveImage(feature)}
                  className="rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
                >
                  <img
                    src={feature.image}
                    alt={`${feature.title} placeholder`}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-900/80 text-white p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl">
            <div className="absolute -top-12 -right-24 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="absolute -bottom-16 -left-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl font-semibold">Ready to go deeper?</h2>
              <p className="text-slate-200 mt-2 max-w-2xl">
                Start with a private beta invite and see how base25 keeps every team
                aligned to the same customer story.
              </p>
            </div>
            <Link to={createPageUrl('Pricing')} className="relative">
              <Button className="bg-white text-slate-900 hover:bg-slate-100">
                See pricing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
        </div>
      </main>

      <PublicFooter />

      <Dialog open={!!activeImage} onOpenChange={(open) => !open && setActiveImage(null)}>
        <DialogContent className="max-w-5xl border-none bg-transparent p-0 shadow-none">
          {activeImage ? (
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xl">
              <img
                src={activeImage.image}
                alt={`${activeImage.title} preview`}
                className="h-auto w-full object-cover"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <BetaAccessModal open={showBetaModal} onOpenChange={setShowBetaModal} />
    </div>
  );
}
