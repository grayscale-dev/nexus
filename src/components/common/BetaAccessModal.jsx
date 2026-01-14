import { useEffect, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const defaultForm = {
  email: '',
  estimated_daily_users: '',
  name: '',
  company: '',
  use_case: '',
  source: '',
};

export default function BetaAccessModal({ open, onOpenChange, onSubmitted }) {
  const [formData, setFormData] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [utmFields, setUtmFields] = useState({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
  });

  useEffect(() => {
    if (!open) return;
    setFormData(defaultForm);
    setSubmitting(false);
    setSubmitted(false);
    setErrorMessage('');
    const params = new URLSearchParams(window.location.search);
    setUtmFields({
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
    });
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = formData.email.trim().toLowerCase();
    const estimatedUsers = Number(formData.estimated_daily_users);
    if (!normalizedEmail || !Number.isInteger(estimatedUsers) || estimatedUsers < 1) {
      setErrorMessage('Please enter a valid email and estimated daily users.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      await base44.functions.invoke('publicWaitlistSignup', {
        email: normalizedEmail,
        estimated_daily_users: estimatedUsers,
        name: formData.name.trim() || null,
        company: formData.company.trim() || null,
        use_case: formData.use_case.trim() || null,
        source: formData.source.trim() || null,
        ...utmFields,
      });
      setSubmitted(true);
      onSubmitted?.();
    } catch (error) {
      console.error('Failed to submit:', error);
      if (error?.message?.includes('429')) {
        setErrorMessage('Please wait a moment and try again.');
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request beta access</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">You’re on the waitlist</h3>
            <p className="text-slate-600">We will reach out soon with your beta access.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="beta_email">Email *</Label>
              <Input
                id="beta_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="beta_estimated_users">
                How many people are going to be accessing your feedback board per day (estimated)?
              </Label>
              <Input
                id="beta_estimated_users"
                type="number"
                min="1"
                step="1"
                value={formData.estimated_daily_users}
                onChange={(e) => setFormData({ ...formData, estimated_daily_users: e.target.value })}
                required
                className="mt-1.5"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="beta_name">Name (Optional)</Label>
                <Input
                  id="beta_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="beta_company">Company / Project name (Optional)</Label>
                <Input
                  id="beta_company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="beta_use_case">Primary use case (Optional)</Label>
              <Textarea
                id="beta_use_case"
                value={formData.use_case}
                onChange={(e) => setFormData({ ...formData, use_case: e.target.value })}
                placeholder="Tell us what you want to use base25 for..."
                className="mt-1.5 min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="beta_source">How did you hear about us? (Optional)</Label>
              <Input
                id="beta_source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="mt-1.5"
              />
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-slate-900 hover:bg-slate-800"
              size="lg"
            >
              {submitting ? 'Submitting...' : (
                <>
                  Request beta access
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
