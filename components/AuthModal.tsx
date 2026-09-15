import React, { useState } from 'react';
import { Mail, Lock, User, LogIn, UserPlus, KeyRound } from 'lucide-react';
import { signIn, signUp, resetPassword } from '../services/auth';
import { Modal, FormField, Input, Button, Notice } from './ui';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        onSuccess();
        onClose();
      } else if (mode === 'signup') {
        const { session } = await signUp(email, password, displayName);
        if (!session) {
          setSuccess('Account created. Check your inbox to confirm your email.');
          setTimeout(() => {
            setMode('signin');
          }, 3000);
        } else {
          onSuccess();
          onClose();
        }
      } else if (mode === 'reset') {
        await resetPassword(email);
        setSuccess('Password reset link sent to your email.');
        setTimeout(() => setMode('signin'), 3000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  const titles: Record<AuthMode, { title: string; subtitle: string; icon: React.ReactNode }> = {
    signin: {
      title: 'Sign In',
      subtitle: 'Access your synced PAO deck and custom themes across devices',
      icon: <LogIn className="w-5 h-5 text-accent" />,
    },
    signup: {
      title: 'Create Account',
      subtitle: 'Enable automatic cloud synchronization and backups',
      icon: <UserPlus className="w-5 h-5 text-accent" />,
    },
    reset: {
      title: 'Reset Password',
      subtitle: 'Enter your account email to receive a recovery link',
      icon: <KeyRound className="w-5 h-5 text-accent" />,
    },
  };

  const activeHeader = titles[mode];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {activeHeader.icon}
          <span className="font-display font-bold text-xl text-charcoal">
            {activeHeader.title}
          </span>
        </div>
      }
      subtitle={activeHeader.subtitle}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Notice variant="danger">{error}</Notice>}
        {success && <Notice variant="success">{success}</Notice>}

        {mode === 'signup' && (
          <FormField label="Display Name">
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Alex"
              leftIcon={<User className="w-4 h-4 text-steel" />}
            />
          </FormField>
        )}

        <FormField label="Email" required>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            required
            leftIcon={<Mail className="w-4 h-4 text-steel" />}
          />
        </FormField>

        {mode !== 'reset' && (
          <FormField label="Password" required>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              leftIcon={<Lock className="w-4 h-4 text-steel" />}
            />
          </FormField>
        )}

        <Button
          variant="accent"
          size="md"
          type="submit"
          loading={loading}
          className="w-full mt-2"
        >
          {mode === 'signin' && 'Sign In'}
          {mode === 'signup' && 'Create Account'}
          {mode === 'reset' && 'Send Reset Link'}
        </Button>

        {/* Mode Switchers */}
        <div className="pt-3 border-t border-border text-center space-y-2 text-xs text-steel">
          {mode === 'signin' && (
            <>
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-semibold text-accent hover:underline"
                >
                  Sign up
                </button>
              </p>
              <p>
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-steel hover:text-charcoal hover:underline"
                >
                  Forgot your password?
                </button>
              </p>
            </>
          )}

          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="font-semibold text-accent hover:underline"
              >
                Sign in
              </button>
            </p>
          )}

          {mode === 'reset' && (
            <p>
              Remember your credentials?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="font-semibold text-accent hover:underline"
              >
                Back to Sign in
              </button>
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
