// features/employees/components/employees-client.tsx
'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import CreateEmployeeDialog from './modals/create-employee-dialog';
import EmployeesTable from './employees-table';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Employee = {
  id: string;
  name: string | null;
  email: string | null;
  token: string;
  tokenActive: boolean;
  boundDeviceId: string | null;
  lastUsed: string | null;
};

type EmployeesResponse = {
  total: number;
  items: Employee[];
  quota?: {
    userLimit: number;
    remaining: number;
    subscriptionActive: boolean;
    subscriptionEnd: string | null;
  };
};

const fetcher = (url: string) =>
  fetch(url, { cache: 'no-store' }).then((r) => {
    if (!r.ok) throw new Error('Failed to fetch');
    return r.json();
  });

export default function EmployeesClient() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<EmployeesResponse>(
    '/api/employees',
    fetcher
  );

  const items = useMemo(() => data?.items ?? [], [data]);
  const remaining = data?.quota?.remaining ?? 0;
  const subscriptionActive = data?.quota?.subscriptionActive ?? false;

  const handleDeleted = async (id: string) => {
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to delete');
      toast.success('Employee deleted');
      mutate();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete employee');
    }
  };

  const handleCreated = async (payload: { name: string; email?: string }) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        // 402 → subscription inactive, 403 → limit reached
        if (res.status === 402 || res.status === 403) {
          toast.error(json?.error || 'Seats unavailable');
          router.push('/dashboard/billing');
          throw new Error(json?.error || 'Seats unavailable');
        }
        throw new Error(json?.error || 'Failed to create employee');
      }
      toast.success('Employee created');
      mutate();
      return json.employee as Employee;
    } catch (e: any) {
      if (!e?.handled) {
        toast.error(e?.message || 'Failed to create employee');
      }
      throw e;
    }
  };

  const disableCreate = !subscriptionActive || remaining <= 0;
  const reason =
    !subscriptionActive
      ? 'Subscription inactive — renew to add seats'
      : 'No remaining seats — upgrade to add more';

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-end">
        {disableCreate ? (
          // Disabled: render a non-interactive button wrapped in a hoverable trigger
          <Tooltip>
            <TooltipTrigger asChild>
              {/* span is hoverable, button is visually disabled */}
              <span className="inline-flex" tabIndex={0}>
                <Button
                  type="button"
                  className={cn(buttonVariants(), 'dark:bg-white bg-black dark:text-black text-white text-xs md:text-sm opacity-60 cursor-not-allowed')}
                  // do NOT pass disabled here; disabled would kill hover events
                  aria-disabled
                >
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add New
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="left">
              {reason}
            </TooltipContent>
          </Tooltip>
        ) : (
          // Enabled: normal dialog trigger + normal button
          <CreateEmployeeDialog onCreated={handleCreated} disabled={false}>
            <Button className={cn(buttonVariants(), 'dark:bg-white bg-black dark:text-black text-white text-xs md:text-sm')}>
              <IconPlus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </CreateEmployeeDialog>
        )}
      </div>

      <EmployeesTable
        rows={items}
        isLoading={isLoading}
        error={!!error}
        onDelete={handleDeleted}
        onRefresh={() => mutate()}
      />
    </div>
  );
}
