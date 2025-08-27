import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import EmployeesClient from '@/features/employees/components/employees-client';

export const metadata = {
  title: 'Dashboard: Employees',
};

export default async function EmployeesPage() {
  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title="Employees"
            description="Manage employees and their tokens"
          />
          {/* The "Add new" button is inside the client component so it can control the dialog + SWR mutate */}
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={5} rowCount={8} withPagination={false} />
          }
        >
          <EmployeesClient />
        </Suspense>
      </div>
    </PageContainer>
  );
}
