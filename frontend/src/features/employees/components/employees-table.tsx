'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    IconCopy,
    IconEye,
    IconEyeOff,
    IconTrash,
} from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type Row = {
    id: string;
    name: string | null;
    email: string | null;
    token: string;
    tokenActive: boolean;
    boundDeviceId: string | null;
    lastUsed: string | null;
};

export default function EmployeesTable({
    rows,
    isLoading,
    error,
    onDelete,
    onRefresh,
}: {
    rows: Row[];
    isLoading?: boolean;
    error?: boolean;
    onDelete: (id: string) => Promise<void> | void;
    onRefresh?: () => void;
}) {
    if (isLoading) {
        return (
            <div className="flex-1 rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            {['Name', 'Email', 'Token', 'Device', 'Last used', ''].map(
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
                                {Array.from({ length: 6 }).map((__, j) => (
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
                Failed to load employees.
                <Button size="sm" variant="outline" className="ml-3" onClick={onRefresh}>
                    Retry
                </Button>
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
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Token</TableHead>
                                <TableHead>Device</TableHead>
                                <TableHead>Last used</TableHead>
                                <TableHead className="w-[70px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.length ? (
                                rows.map((r) => (
                                    <RowItem key={r.id} row={r} onDelete={() => onDelete(r.id)} />
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No employees yet.
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

function RowItem({
    row,
    onDelete,
}: {
    row: Row;
    onDelete: () => void | Promise<void>;
}) {
    const [show, setShow] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(row.token);
            toast.success('Token copied');
        } catch {
            toast.error('Failed to copy');
        }
    };

    return (
        <TableRow>
            <TableCell className="font-medium">{row.name || '—'}</TableCell>
            <TableCell className="text-muted-foreground">{row.email || '—'}</TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <code
                        className="rounded bg-muted px-2 py-1 text-xs font-mono"
                        style={{ minWidth: "16ch", display: "inline-block" }}
                    >
                        {show ? row.token : '•'.repeat(row.token.length)}
                    </code>


                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShow((s) => !s)}
                        title={show ? 'Hide token' : 'Show token'}
                    >
                        {show ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={copy}
                        title="Copy token"
                    >
                        <IconCopy className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
                {row.boundDeviceId ? 'Bound' : '—'}
            </TableCell>
            <TableCell className="text-muted-foreground">
                {row.lastUsed ? new Date(row.lastUsed).toLocaleString() : '—'}
            </TableCell>
            <TableCell className="text-right">
                <AlertDialog open={confirmOpen} onOpenChange={(o) => !deleting && setConfirmOpen(o)}>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-600"
                            title="Delete employee"
                        >
                            <IconTrash className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete employee?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. The employee record will be permanently removed.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                            <Button
                                asChild
                                variant="destructive"
                                disabled={deleting}
                            >
                                <AlertDialogAction
                                    onClick={async () => {
                                        try {
                                            setDeleting(true);
                                            await onDelete();
                                        } finally {
                                            setDeleting(false);
                                            setConfirmOpen(false);
                                        }
                                    }}
                                >
                                    {deleting ? 'Deleting…' : 'Delete'}
                                </AlertDialogAction>
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </TableCell>
        </TableRow>
    );
}
