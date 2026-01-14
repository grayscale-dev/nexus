import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Users, Key, Trash2, 
  Save, Copy, Check 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Badge from '@/components/common/Badge';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function WorkspaceSettings() {
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('restricted');
  const [supportEnabled, setSupportEnabled] = useState(true);
  const [settings, setSettings] = useState({});
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0f172a');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [slugError, setSlugError] = useState('');
  
  // Access management
  const [members, setMembers] = useState([]);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [accessCodeStatus, setAccessCodeStatus] = useState({ hasCode: false, expiresAt: null });
  const [accessCodeExpiry, setAccessCodeExpiry] = useState('7d');
  const [generatedAccessCode, setGeneratedAccessCode] = useState('');
  const [creatingAccessCode, setCreatingAccessCode] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState(null);

  useEffect(() => {
    const storedWorkspace = sessionStorage.getItem('selectedBoard');
    const storedRole = sessionStorage.getItem('currentRole');
    
    if (!storedWorkspace || storedRole !== 'admin') {
      navigate(createPageUrl('Feedback'));
      return;
    }
    
    const ws = JSON.parse(storedWorkspace);
    setWorkspace(ws);
    setRole(storedRole);
    setName(ws.name);
    setSlug(ws.slug);
    setDescription(ws.description || '');
    setVisibility(ws.visibility || 'restricted');
    setSupportEnabled(ws.support_enabled !== false);
    setSettings(ws.settings || {});
    setLogoUrl(ws.logo_url || '');
    setPrimaryColor(ws.primary_color || '#0f172a');
    
    loadAccessData(ws.id);
  }, []);

  const loadAccessData = async (workspaceId) => {
    try {
      const [rolesData, accessCodeData] = await Promise.all([
        base44.entities.BoardRole.filter({ board_id: workspaceId }),
        base44.functions.invoke('getBoardAccessCodeStatus', { board_id: workspaceId })
      ]);
      setMembers(rolesData);
      const status = accessCodeData?.data;
      setAccessCodeStatus({
        hasCode: Boolean(status?.has_code),
        expiresAt: status?.expires_at ?? null
      });
    } catch (error) {
      console.error('Failed to load access data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateSlug = (value) => {
    // Reset error
    setSlugError('');
    
    // Check length
    if (value.length < 3 || value.length > 50) {
      return 'Slug must be between 3 and 50 characters';
    }
    
    // Check format: lowercase letters, numbers, hyphens only
    if (!/^[a-z0-9-]+$/.test(value)) {
      return 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    
    // Check no leading/trailing hyphens
    if (value.startsWith('-') || value.endsWith('-')) {
      return 'Slug cannot start or end with a hyphen';
    }
    
    // Check no consecutive hyphens
    if (value.includes('--')) {
      return 'Slug cannot contain consecutive hyphens';
    }
    
    return null;
  };

  const handleSaveSettings = async () => {
    if (!workspace) return;
    
    // Validate slug if changed
    if (slug !== workspace.slug) {
      const slugValidationError = validateSlug(slug);
      if (slugValidationError) {
        setSlugError(slugValidationError);
        return;
      }
      
      // Check uniqueness
      try {
        const existing = await base44.entities.Board.filter({ slug });
        if (existing.length > 0 && existing[0].id !== workspace.id) {
          setSlugError('This slug is already taken by another board');
          return;
        }
      } catch (error) {
        console.error('Failed to check slug uniqueness:', error);
        setSlugError('Failed to validate slug. Please try again.');
        return;
      }
    }
    
    setSaving(true);
    try {
      await base44.entities.Board.update(workspace.id, {
        name,
        slug,
        description,
        visibility,
        support_enabled: supportEnabled,
        settings,
        logo_url: logoUrl,
        primary_color: primaryColor
      });
      
      // Update session storage
      const updatedWorkspace = { ...workspace, name, slug, description, visibility, support_enabled: supportEnabled, settings, logo_url: logoUrl, primary_color: primaryColor };
      sessionStorage.setItem('selectedBoard', JSON.stringify(updatedWorkspace));
      sessionStorage.setItem('selectedBoardId', updatedWorkspace.id);
      setWorkspace(updatedWorkspace);
      
      // If slug changed, navigate to new URL
      if (slug !== workspace.slug) {
        window.location.href = `/board/${slug}/feedback`;
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member\'s access?')) return;
    
    try {
      await base44.entities.BoardRole.delete(memberId);
      loadAccessData(workspace.id);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleCreateAccessCode = async () => {
    if (!workspace) return;
    setCreatingAccessCode(true);
    try {
      const { data } = await base44.functions.invoke('setBoardAccessCode', {
        board_id: workspace.id,
        expires_in: accessCodeExpiry
      });
      setGeneratedAccessCode(data?.access_code ?? '');
      setAccessCodeStatus({
        hasCode: true,
        expiresAt: data?.expires_at ?? null
      });
    } catch (error) {
      console.error('Failed to create access code:', error);
      alert('Failed to create access code. Please try again.');
    } finally {
      setCreatingAccessCode(false);
    }
  };

  const handleUpdateMemberRole = async (memberId, nextRole) => {
    setUpdatingMemberId(memberId);
    try {
      await base44.entities.BoardRole.update(memberId, { role: nextRole });
      setMembers((prev) => prev.map((member) => (
        member.id === memberId ? { ...member, role: nextRole } : member
      )));
    } catch (error) {
      console.error('Failed to update member role:', error);
      alert('Failed to update role. Please try again.');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleCopyUrl = () => {
    const url = `${window.location.origin}/board/${workspace.slug}/feedback`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(file_url);
    } catch (error) {
      console.error('Failed to upload logo:', error);
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Board Settings</h1>
          <p className="text-slate-500 mt-1">
            Configure your board and manage access
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(createPageUrl('Billing'))}>
          Billing
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Tokens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your board details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Board Name</Label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 max-w-md"
                />
              </div>
              <div>
                <Label>Board Slug</Label>
                <Input 
                  value={slug} 
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase();
                    setSlug(value);
                    setSlugError('');
                  }}
                  className="mt-1.5 max-w-md font-mono"
                  placeholder="my-board-slug"
                />
                {slugError && (
                  <p className="text-xs text-red-600 mt-1">{slugError}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Used in the board URL. Lowercase letters, numbers, and hyphens only (3-50 chars).
                </p>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 max-w-md"
                  placeholder="Optional description"
                />
              </div>
              <div>
                <Label>Board Logo</Label>
                <div className="flex items-center gap-4 mt-1.5">
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded-lg border border-slate-200" />
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button variant="outline" size="sm" asChild>
                      <span>{uploadingLogo ? 'Uploading...' : (logoUrl ? 'Change Logo' : 'Upload Logo')}</span>
                    </Button>
                  </label>
                  {logoUrl && (
                    <Button variant="ghost" size="sm" onClick={() => setLogoUrl('')}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label>Primary Brand Color</Label>
                <div className="flex items-center gap-3 mt-1.5">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-20 rounded border border-slate-200 cursor-pointer"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#0f172a"
                    className="max-w-32 font-mono"
                  />
                  <span className="text-sm text-slate-500">Used for buttons and accents</span>
                </div>
              </div>
              <div>
                <Label>Public Board URL</Label>
                <div className="mt-1.5 max-w-md flex gap-2">
                  <Input 
                    value={`${window.location.origin}/board/${workspace?.slug || ''}/feedback`}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                    className="shrink-0"
                  >
                    {copiedUrl ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {visibility === 'public' 
                    ? 'Anyone can view this board. To contribute, users must log in and have access.' 
                    : 'Private board—only users with access can view. To contribute, users must log in.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Enable or disable board features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between max-w-md">
                <div>
                  <Label>Visibility</Label>
                  <p className="text-sm text-slate-500">Control who can view public content</p>
                </div>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between max-w-md">
                <div>
                  <Label>Support Messaging</Label>
                  <p className="text-sm text-slate-500">Enable support ticket system</p>
                </div>
                <Switch 
                  checked={supportEnabled} 
                  onCheckedChange={setSupportEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between max-w-md">
                <div>
                  <Label>File Attachments</Label>
                  <p className="text-sm text-slate-500">Allow file uploads in feedback</p>
                </div>
                <Switch 
                  checked={settings.allow_attachments !== false}
                  onCheckedChange={(v) => setSettings({ ...settings, allow_attachments: v })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button 
              variant="destructive"
              onClick={async () => {
                if (!confirm('Are you sure you want to delete this board? This action cannot be undone and will remove all data including feedback, roadmap items, and documentation.')) return;
                try {
                  await base44.entities.Board.update(workspace.id, { status: 'archived' });
                  sessionStorage.clear();
                  navigate(createPageUrl('Workspaces'));
                } catch (error) {
                  console.error('Failed to delete board:', error);
                  alert('Failed to delete board. Please try again.');
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Board
            </Button>
            <Button 
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {saving ? 'Saving...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Access code</CardTitle>
              <CardDescription>
                Require a code for users to join your private board.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">
                    {accessCodeStatus.hasCode
                      ? 'Access code is active.'
                      : 'No access code created yet.'}
                  </p>
                  {accessCodeStatus.expiresAt ? (
                    <p className="text-xs text-slate-500 mt-1">
                      Expires on {new Date(accessCodeStatus.expiresAt).toLocaleString()}
                    </p>
                  ) : accessCodeStatus.hasCode ? (
                    <p className="text-xs text-slate-500 mt-1">Never expires.</p>
                  ) : null}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={accessCodeExpiry} onValueChange={setAccessCodeExpiry}>
                    <SelectTrigger className="w-40" disabled={visibility !== 'restricted'}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 hours</SelectItem>
                      <SelectItem value="7d">7 days</SelectItem>
                      <SelectItem value="30d">30 days</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleCreateAccessCode}
                    disabled={creatingAccessCode || visibility !== 'restricted'}
                    className="bg-slate-900 hover:bg-slate-800"
                  >
                    {creatingAccessCode
                      ? 'Creating...'
                      : accessCodeStatus.hasCode
                        ? 'Generate new code'
                        : 'Create access code'}
                  </Button>
                </div>
              </div>
              {generatedAccessCode ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-900">
                    Share this access code
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    This code is shown only once. Copy it now.
                  </p>
                  <div className="mt-3 flex flex-col sm:flex-row gap-3 items-center">
                    <Input
                      value={generatedAccessCode}
                      readOnly
                      className="font-mono tracking-[0.3em] text-center uppercase"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedAccessCode);
                      }}
                    >
                      Copy code
                    </Button>
                  </div>
                </div>
              ) : null}
              <p className="text-xs text-slate-500">
                Users must log in and enter the code on the board page to get contributor access.
                {visibility !== 'restricted' ? ' Switch visibility to Restricted to require a code.' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage permissions for existing board members.</CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No users yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Assigned via</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleUpdateMemberRole(member.id, value)}
                          >
                            <SelectTrigger className="w-40" disabled={updatingMemberId === member.id}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="contributor">Contributor</SelectItem>
                              <SelectItem value="support">Support</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.assigned_via}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={updatingMemberId === member.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Tokens</CardTitle>
              <CardDescription>
                Manage API tokens for external integrations.{' '}
                <a href={createPageUrl('ApiDocs')} className="text-blue-600 hover:underline">
                  View API Documentation
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 text-center py-8">
                API token management is available in the API Docs section
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
