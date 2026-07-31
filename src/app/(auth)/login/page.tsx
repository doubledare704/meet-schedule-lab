'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AuthCard } from '@/components/auth/AuthCard';
import { Icon } from '@/components/ui/Icon';

const DEMO_USERS = [
  { label: 'Alex Developer', email: 'alex@example.com', password: 'password123' },
  { label: 'Sarah Product Manager', email: 'sarah@example.com', password: 'password123' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login(loginEmail: string, loginPassword: string) {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const body = await res.json();

      if (!body.success) {
        setError(body.error || 'Login failed.');
        return;
      }

      router.push('/schedule');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    login(email, password);
  }

  function fillDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    login(demoEmail, demoPassword);
  }

  return (
    <AuthCard activeTab="login">
      <form className="flex w-full flex-col gap-2" onSubmit={handleSubmit} autoComplete="off">
        {error && (
          <div className="mb-2 flex items-center gap-1 px-1">
            <Icon name="error" size={16} className="text-error" />
            <span className="text-label-sm text-error">{error}</span>
          </div>
        )}

        <div className="relative">
          <input
            id="email"
            type="email"
            required
            placeholder=" "
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="peer w-full rounded-lg border border-outline/30 bg-transparent px-4 py-3 text-body-md text-on-surface outline-none transition-all focus:border-primary"
          />
          <label
            htmlFor="email"
            className="pointer-events-none absolute left-4 top-3 text-label-md text-on-surface-variant transition-all duration-150 peer-focus:-top-2 peer-focus:left-3 peer-focus:bg-surface-container peer-focus:px-1 peer-focus:text-primary peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:bg-surface-container peer-[:not(:placeholder-shown)]:px-1"
          >
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
            className="peer w-full rounded-lg border border-outline/30 bg-transparent px-4 py-3 pr-12 text-body-md text-on-surface outline-none transition-all focus:border-primary"
          />
          <label
            htmlFor="password"
            className="pointer-events-none absolute left-4 top-3 text-label-md text-on-surface-variant transition-all duration-150 peer-focus:-top-2 peer-focus:left-3 peer-focus:bg-surface-container peer-focus:px-1 peer-focus:text-primary peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:bg-surface-container peer-[:not(:placeholder-shown)]:px-1"
          >
            Password
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} />
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary-container py-3 text-label-md text-on-primary-container shadow-lg shadow-primary-container/20 transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {loading && <Icon name="progress_activity" size={18} className="animate-spin" />}
          Sign In
        </button>

        <button
          type="button"
          className="py-1 text-center text-label-md text-on-surface-variant transition-colors hover:text-primary"
        >
          Forgot your password?
        </button>
      </form>

      <div className="mt-6 w-full border-t border-outline/10 pt-6">
        <p className="mb-3 text-center text-label-sm uppercase tracking-wider text-on-surface-variant">
          Quick Test Accounts
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {DEMO_USERS.map((user) => (
            <button
              key={user.email}
              type="button"
              onClick={() => fillDemo(user.email, user.password)}
              className="rounded-full border border-outline/10 bg-surface-variant px-3 py-1 text-label-sm text-on-surface transition-all duration-150 hover:bg-surface-dim"
            >
              {user.label}
            </button>
          ))}
        </div>
      </div>
    </AuthCard>
  );
}
