import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

type Row = {
    id: string;
    paidAt: string;
    amountCents: number;
    planId: string;
    seats: number;
};

export default function BillingTable({
    rows,
    isLoading,
    error,
}: {
    rows: Row[];
    isLoading?: boolean;
    error?: boolean;
}) {
    if (isLoading) {
        return (
            <div className="flex-1 rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            {['Payment Date', 'Amount', 'Plan', 'Seats'].map(
                                (h) => (
                                    <TableHead key={h}>
                                        <Skeleton className="h-6 w-full" />
                                    </TableHead>
                                )
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <TableRow key={i} className="hover:bg-transparent">
                                {Array.from({ length: 4 }).map((__, j) => (
                                    <TableCell key={`${i}-${j}`}>
                                        <Skeleton className="h-6 w-full" />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}

                    </TableBody>
                </Table>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-md border p-6 text-sm text-red-600">
                Failed to load payments.
            </div>
        );
    }

    return (
        <div className="relative flex flex-1">
            <div className="absolute inset-0 flex overflow-hidden rounded-lg border">
                <ScrollArea className="h-full w-full">
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-muted">
                            <TableRow>
                                <TableHead>Payment Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Seats</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.length ? (
                                rows.map((r) => (
                                    <RowItem key={r.id} row={r} />
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No payments yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        </div>
    );
}

function RowItem({ row }: { row: Row }) {
    return (
        <TableRow>
            <TableCell className="font-medium">
                {row.paidAt ? format(new Date(row.paidAt), "yyyy-MM-dd") : "—"}
            </TableCell>
            {/* Amount second */}
            <TableCell className="text-muted-foreground">
                {row.amountCents ? (row.amountCents / 100).toFixed(2) : "—"}
            </TableCell>
            {/* Plan third */}
            <TableCell className="text-muted-foreground capitalize">
                {row.planId || "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">{row.seats}</TableCell>
        </TableRow>
    );
}
