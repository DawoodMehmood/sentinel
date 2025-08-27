'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/signin' })}
      className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800"
    >
      Sign Out
    </button>
  );
}
