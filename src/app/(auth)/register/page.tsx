'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AuthCard } from '@/components/auth/AuthCard';
import { Icon } from '@/components/ui/Icon';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    if (!name.trim()) return 'Name is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password.length > 72) return 'Password must not exceed 72 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });

      const body = await res.json();

      if (!body.success) {
        setError(body.error || 'Registration failed.');
        return;
      }

      router.push('/schedule');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    'peer w-full rounded-lg border border-outline/30 bg-transparent px-4 py-3 text-body-md text-on-surface outline-none transition-all focus:border-primary';
  const labelClass =
    'pointer-events-none absolute left-4 top-3 text-label-md text-on-surface-variant transition-all duration-150 peer-focus:-top-2 peer-focus:left-3 peer-focus:bg-surface-container peer-focus:px-1 peer-focus:text-primary peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:bg-surface-container peer-[:not(:placeholder-shown)]:px-1';

  return (
    <AuthCard activeTab="register">
      <form className="flex w-full flex-col gap-2" onSubmit={handleSubmit} autoComplete="off">
        {error && (
          <div className="mb-2 flex items-center gap-1 px-1">
            <Icon name="error" size={16} className="text-error" />
            <span className="text-label-sm text-error">{error}</span>
          </div>
        )}

        <div className="relative">
          <input id="name" type="text" required placeholder=" " value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          <label htmlFor="name" className={labelClass}>
            Full Name
          </label>
        </div>

        <div className="relative">
          <input id="email" type="email" required placeholder=" " value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
          <label htmlFor="email" className={labelClass}>
            Work Email
          </label>
        </div>

        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder=" "
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${fieldClass} pr-12`}
          />
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-primary"
          >
            <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} />
          </button>
        </div>

        <div className="relative">
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder=" "
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={fieldClass}
          />
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirm Password
          </label>
        </div>

        <p className="px-1 text-label-sm text-on-surface-variant">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-primary hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
          .
        </p>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-primary-container py-3 text-label-md text-on-primary-container shadow-md transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {loading && <Icon name="progress_activity" size={18} className="animate-spin" />}
          Create Account
        </button>
      </form>
    </AuthCard>
  );
}
