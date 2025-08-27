'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import CreateEmployeeDialog from './modals/create-employee-dialog';
import EmployeesTable from './employees-table';

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
};

const fetcher = (url: string) =>
  fetch(url, { cache: 'no-store' }).then((r) => {
    if (!r.ok) throw new Error('Failed to fetch');
    return r.json();
  });

export default function EmployeesClient() {
  const { data, error, isLoading, mutate } = useSWR<EmployeesResponse>(
    '/api/employees',
    fetcher
  );

  const items = useMemo(() => data?.items ?? [], [data]);

  const handleDeleted = async (id: string) => {
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to delete');
      toast.success('Employee deleted');
      mutate();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
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
      if (!res.ok) throw new Error(json?.error || 'Failed to create employee');
      toast.success('Employee created');
      mutate();
      return json.employee as Employee;
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create employee');
      throw e;
    }
  };

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-end">
        <CreateEmployeeDialog onCreated={handleCreated}>
          <Button className={cn(buttonVariants(), 'text-xs md:text-sm')}>
            <IconPlus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </CreateEmployeeDialog>
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
