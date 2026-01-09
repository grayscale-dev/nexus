import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Profile Completion Modal
 * 
 * Shown when a user attempts a write action without a display name.
 * Blocks the action until profile is completed, then retries.
 */
export default function ProfileCompletionModal({ isOpen, onComplete, onCancel }) {
  const [displayName, setDisplayName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updates = { full_name: displayName.trim() };

      // Upload profile photo if provided (optional)
      if (profilePhoto) {
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: profilePhoto });
          updates.profile_photo_url = file_url;
        } catch (photoError) {
          console.error('Failed to upload photo (optional):', photoError);
          // Continue without photo - it's optional
        }
      }

      // Update user profile
      await base44.auth.updateMe(updates);

      // Clean up preview URL
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }

      onComplete();
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('Failed to save profile. Please try again.');
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please set your display name before contributing. Your profile photo is optional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Display Name - Required */}
          <div>
            <Label htmlFor="displayName" className="flex items-center gap-2 mb-2">
              Display Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className="w-full"
              autoFocus
            />
          </div>

          {/* Profile Photo - Optional */}
          <div>
            <Label htmlFor="profilePhoto" className="flex items-center gap-2 mb-2">
              Profile Photo <span className="text-xs text-slate-500">(Optional)</span>
            </Label>
            
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="relative">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="h-16 w-16 rounded-full object-cover border-2 border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(photoPreview);
                      setPhotoPreview(null);
                      setProfilePhoto(null);
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <User className="h-8 w-8 text-slate-400" />
                </div>
              )}

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  <Upload className="h-4 w-4 text-slate-600" />
                  <span className="text-sm text-slate-600">
                    {profilePhoto ? 'Change Photo' : 'Upload Photo'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!displayName.trim() || saving}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {saving ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}