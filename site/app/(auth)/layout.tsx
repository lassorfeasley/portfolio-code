import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    default: 'Account access',
    template: '%s · Account access',
  },
  description: 'Sign in to Lassor.com or manage your account credentials.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="retro-root">
      <div className="globalmargin">
        <div className="topbar">
          <Link href="/" className="h _5 link w-inline-block">
            <div>Lassor.com</div>
            <div>→</div>
          </Link>
          <div className="h _5 link">
            <div>Account access</div>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}


