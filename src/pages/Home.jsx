import { useState } from 'react';
import { ArrowRight, CheckCircle, MessageSquare, Map, Sparkles, BookOpen, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export default function Home() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        window.location.href = createPageUrl('Workspaces');
      } else {
        base44.auth.redirectToLogin(window.location.origin + createPageUrl('Workspaces'));
      }
    } catch (error) {
      base44.auth.redirectToLogin(window.location.origin + createPageUrl('Workspaces'));
    }
  };

  const features = [
    {
      icon: MessageSquare,
      title: 'Feedback Management',
      description: 'Collect, organize, and prioritize customer feedback in one central hub.'
    },
    {
      icon: Map,
      title: 'Product Roadmap',
      description: 'Share your product vision and keep customers informed about upcoming features.'
    },
    {
      icon: Sparkles,
      title: 'Changelog',
      description: 'Announce new features and improvements with beautiful changelog entries.'
    },
    {
      icon: BookOpen,
      title: 'Documentation',
      description: 'Create comprehensive docs and knowledge base for your customers.'
    },
    {
      icon: Users,
      title: 'Support Threads',
      description: 'Manage customer support conversations with built-in ticketing system.'
    },
    {
      icon: CheckCircle,
      title: 'Workflow Automation',
      description: 'Link feedback to roadmap items and automatically update customers.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-lg font-bold text-slate-900">Nexus</span>
          </div>
          <Button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {isLoggingIn ? 'Loading...' : 'Sign In'}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
          Your Customer Feedback Hub
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Centralize feedback, showcase your roadmap, and keep customers in the loop with beautiful changelogs and documentation.
        </p>
        <Button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          size="lg"
          className="bg-slate-900 hover:bg-slate-800 text-lg px-8 py-6"
        >
          {isLoggingIn ? 'Loading...' : (
            <>
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
          Everything you need to manage customer communication
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-slate-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="bg-slate-900 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to transform your customer feedback?
          </h2>
          <p className="text-slate-300 mb-8 text-lg">
            Join teams who are already using Nexus to build better products.
          </p>
          <Button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            size="lg"
            className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 py-6"
          >
            {isLoggingIn ? 'Loading...' : (
              <>
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-slate-500 text-sm">
          © 2026 Nexus. All rights reserved.
        </div>
      </footer>
    </div>
  );
}