'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, useQueryState, parseAsStringEnum } from 'nuqs';

type Row = {
  id: string;
  seqKey: string;
  n: number;
  support: number;
  employees: number;
  lastSeen: string; // ISO string from API
};

interface PatternTableParams<TData extends Row, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
}

export function PatternTable<TData extends Row, TValue>({
  data,
  totalItems,
  columns
}: PatternTableParams<TData, TValue>) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  // keep sort in url to drive server sorting
  useQueryState('sortBy', parseAsStringEnum(['n','support','employees','lastSeen']).withDefault('lastSeen'));
  useQueryState('sortDir', parseAsStringEnum(['asc','desc']).withDefault('desc'));

  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow: false,     // updates querystring -> triggers RSC fetch
    debounceMs: 500
  });

  return (
    <DataTable table={table}>
      {/* View Options button (column visibility) + filters live inside this toolbar */}
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
