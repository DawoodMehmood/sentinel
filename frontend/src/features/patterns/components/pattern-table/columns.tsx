'use client';

import { Column, ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { format, formatDistanceToNow } from 'date-fns';

export type Row = {
  id: string;
  seqKey: string;
  n: number;
  support: number;
  employees: number;
  lastSeen: string; // ISO string (we normalized this in the RSC)
};

// small helper so headers match your Product columns’ API
function Header<T>(column: Column<T, unknown>, title: string) {
  return <DataTableColumnHeader column={column as any} title={title} />;
}

export const columns: ColumnDef<Row>[] = [
  {
    id: 'seqKey',
    accessorKey: 'seqKey',
    header: ({ column }) => Header<Row>(column, 'Pattern'),
    cell: ({ cell }) => (
        <div className="tabular-nums justify-center">
        {cell.getValue<Row['seqKey']>()}
      </div>
    ),
    enableColumnFilter: true,
    meta: {
      label: 'Seq key',
      placeholder: 'Search pattern...',
      variant: 'text',
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'n',
    accessorKey: 'n',
    header: ({ column }) => Header<Row>(column, '# of apps'),
    cell: ({ cell }) => (
      <div className="tabular-nums justify-center">
        {cell.getValue<Row['n']>()}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
    meta: { label: '# of apps' },
  },
  {
    id: 'support',
    accessorKey: 'support',
    header: ({ column }) => Header<Row>(column, '# of pattern occurrences'),
    cell: ({ cell }) => (
      <div className="tabular-nums justify-center">
        {cell.getValue<Row['support']>()}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
    meta: { label: '# of pattern occurrences' },
  },
  {
    id: 'employees',
    accessorKey: 'employees',
    header: ({ column }) => Header<Row>(column, '# of employees with pattern'),
    cell: ({ cell }) => (
      <div className="tabular-nums justify-center">
        {cell.getValue<Row['employees']>()}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
    meta: { label: '# of employees with pattern' },
  },
  {
    id: 'lastSeen',
    accessorKey: 'lastSeen',
    header: ({ column }) => Header<Row>(column, 'Last seen'),
    cell: ({ cell }) => {
      const iso = cell.getValue<Row['lastSeen']>();
      const d = new Date(iso);
      const valid = !isNaN(d.getTime());
      return (
        <div className="flex flex-col items-start">
          <span className="text-sm">
            {valid ? formatDistanceToNow(d, { addSuffix: true }) : '—'}
          </span>
          {valid && (
            <span className="text-xs text-muted-foreground">
              {format(d, 'yyyy-MM-dd HH:mm')}
            </span>
          )}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
    meta: { label: 'Last seen' },
  },
];
