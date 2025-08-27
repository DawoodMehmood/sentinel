import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import PatternsListingPage from '@/features/patterns/components/pattern-listing';
import RefreshButton from '@/features/patterns/components/refresh-button';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Patterns'
};

type PageProps = { searchParams: Promise<SearchParams> };

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title="Patterns"
            description="Sequence patterns observed across your company."
          />
          <RefreshButton />
        </div>
        <Separator />
        <Suspense
          fallback={<DataTableSkeleton columnCount={5} rowCount={8} filterCount={3} />}
        >
          <PatternsListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
