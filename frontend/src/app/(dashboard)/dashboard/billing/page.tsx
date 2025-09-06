import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import BillingListing from '@/features/billing/components/billing-listing';

export const metadata = { title: 'Dashboard: Billing' };

export default async function BillingPage() {
  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title="Billing"
            description="Manage your plan, renewal, and payment history"
          />
        </div>
        <Separator />
        <Suspense
          fallback={<DataTableSkeleton columnCount={4} rowCount={6} withPagination={false} />}
        >
          <BillingListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}
