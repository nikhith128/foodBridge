import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail, Sparkles } from 'lucide-react';
import { Button, Card, Input, useToast } from '../../components/ui/index.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { success, error: raiseError } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      raiseError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      success('Password reset instructions sent to your email.');
    }, 800);
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Card padding="lg" className="space-y-6">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">Reset Your Password</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Enter your registered account email and we&apos;ll send you instructions to reset your password.
            </p>
          </div>

          {submitted ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint text-primary">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-title-md text-title-md font-semibold text-on-surface">Check your inbox</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  We have sent password recovery instructions to <strong className="text-on-surface">{email}</strong>.
                </p>
              </div>
              <Button as={Link} to="/login" fullWidth>
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button type="submit" fullWidth loading={loading}>
                Send Reset Instructions
              </Button>
            </form>
          )}

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 font-label-md text-label-md text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
