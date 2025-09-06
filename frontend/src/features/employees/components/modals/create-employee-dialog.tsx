'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CreateEmployeeDialog({
  children,
  onCreated,
  disabled = false,
}: {
  children: React.ReactNode; // trigger
  onCreated: (payload: { name: string; email?: string }) => Promise<any>;
  disabled?: boolean;        // 👈 NEW
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  // If it becomes disabled while open, close it.
  React.useEffect(() => {
    if (disabled && open) setOpen(false);
  }, [disabled, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || disabled) return;

    setSubmitting(true);
    try {
      await onCreated({ name: name.trim(), email: email.trim() || undefined });
      setOpen(false);
      setName('');
      setEmail('');
    } finally {
      setSubmitting(false);
    }
  }

  const canInteract = !disabled && !submitting;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (canInteract) setOpen(v);
      }}
    >
      <DialogTrigger asChild>
        {/* Ensure the trigger looks/acts disabled even if the child isn't a Button */}
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<any>, {
              disabled: disabled || (children as any).props?.disabled,
              'aria-disabled': disabled || (children as any).props?.disabled,
            })
          : <span aria-disabled className={disabled ? 'pointer-events-none opacity-60' : ''}>{children}</span>}
      </DialogTrigger>

      {/* When disabled, don't render the content at all */}
      {!disabled && (
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add employee</DialogTitle>
            <DialogDescription>
              Create a new employee to generate their token.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="emp-name">Name</Label>
              <Input
                id="emp-name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                disabled={submitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="emp-email">Email (optional)</Label>
              <Input
                id="emp-email"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className='dark:bg-white bg-black dark:text-black text-white'>
                {submitting ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
