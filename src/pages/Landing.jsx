import { Link } from 'react-router-dom';
import { Eye, Settings, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Logo & Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
            <Folder className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Feedback Portal
          </h1>
          <p className="text-xl text-slate-300">
            Choose how you'd like to access the platform
          </p>
        </div>

        {/* Two Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Public Access */}
          <Link to={createPageUrl('PublicWorkspaceSelector')}>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all cursor-pointer group">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                  <Eye className="h-8 w-8 text-blue-300" />
                </div>
                <h2 className="text-2xl font-bold text-white">Public Access</h2>
              </div>
              <p className="text-slate-300 mb-6">
                View feedback, roadmap, and submit requests as a contributor or viewer.
              </p>
              <div className="flex items-center text-blue-300 font-medium group-hover:translate-x-2 transition-transform">
                Continue as Viewer/Contributor
                <span className="ml-2">→</span>
              </div>
            </div>
          </Link>

          {/* Management Access */}
          <Link to={createPageUrl('WorkspaceSelector')}>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all cursor-pointer group">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                  <Settings className="h-8 w-8 text-purple-300" />
                </div>
                <h2 className="text-2xl font-bold text-white">Management</h2>
              </div>
              <p className="text-slate-300 mb-6">
                Admin and support team access to manage workspaces, settings, and moderate content.
              </p>
              <div className="flex items-center text-purple-300 font-medium group-hover:translate-x-2 transition-transform">
                Continue as Admin/Support
                <span className="ml-2">→</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}