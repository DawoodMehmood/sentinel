'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { IconRefresh } from '@tabler/icons-react';

type Props = { className?: string };

export default function RefreshButton({ className }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      className={cn(buttonVariants(), 'text-xs md:text-sm', className)}
      aria-label="Refresh"
      disabled={isPending}
    >
      <IconRefresh className={cn('h-4 w-4', isPending && 'animate-spin')} />
      <span className="ml-1">{isPending ? 'Refreshing…' : 'Refresh'}</span>
    </button>
  );
}
