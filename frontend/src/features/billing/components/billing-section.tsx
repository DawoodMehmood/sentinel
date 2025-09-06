'use client';

import { PLANS } from '@/lib/plans';
import CheckoutButton from '@/features/billing/checkout-button';
import { format, formatDate } from 'date-fns';
import BillingTable from './billing-table';
import { cn } from '@/lib/utils';
import { IconWifi } from '@tabler/icons-react';

function StatusBadge({ expired }: { expired: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold',
                expired
                    ? 'border-red-400 bg-red-400 text-red-900'
                    : 'border-green-400 bg-green-400 text-green-900'
            )}
        >
            {expired ? 'Expired' : 'Active'}
        </span>
    );
}

interface CreditCardProps {
    company?: string;
    cardNumber?: string;
    cardHolder?: string;
    cardExpiration?: string;
    className?: string;
}
const CreditCardFront = ({
    company = "Sentinel.",
    cardNumber = "*** **** **** 1234",
    cardHolder = "OLIVIA RHYE",
    cardExpiration = "06/28",
    className,
}: CreditCardProps) => {
    const originalWidth = 316;
    const originalHeight = 190;

    return (
        <div
            style={{
                width: `${originalWidth}px`,
                height: `${originalHeight}px`,
            }}
            className={cn("relative flex", className)}
        >
            <div
                style={{
                    transform: `scale(${1})`,
                    width: `${originalWidth}px`,
                    height: `${originalHeight}px`,
                }}
                className={cn("bg-black absolute top-0 left-0 flex origin-top-left flex-col justify-between overflow-hidden rounded-2xl p-4", 'bg-linear-to-tr from-gray-900 to-gray-700 before:pointer-events-none before:absolute before:inset-0 before:z-1 before:rounded-[inherit] before:mask-linear-135 before:mask-linear-to-white/20 before:ring-1 before:ring-white/30 before:ring-inset')}
            >
                <div className="absolute -top-4 -left-4 grid grid-cols-2 blur-3xl">
                    <div className="size-20 rounded-tl-full bg-pink-500 opacity-90 mix-blend-normal" />
                    <div className="size-20 rounded-tr-full bg-orange-500 opacity-50 mix-blend-normal" />
                    <div className="size-20 rounded-bl-full bg-blue-500 opacity-70 mix-blend-normal" />
                    <div className="size-20 rounded-br-full bg-success-500 opacity-50 mix-blend-normal" />
                </div>

                <div className="relative flex items-start justify-between px-1 pt-1">
                    <div className={cn("text-md leading-[normal] font-semibold", 'text-white')}>{company}</div>

                    <IconWifi className={'text-white rotate-90'} />
                </div>

                <div className="relative flex items-end justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-2">
                        <div className="flex items-end gap-1">
                            <p
                                style={{
                                    wordBreak: "break-word",
                                }}
                                className={cn("text-xs leading-snug font-semibold tracking-[0.6px] uppercase", 'text-white')}
                            >
                                {cardHolder}
                            </p>
                            <p
                                className={cn(
                                    "ml-auto text-right text-xs leading-[normal] font-semibold tracking-[0.6px] tabular-nums",
                                    'text-white',
                                )}
                            >
                                {cardExpiration}
                            </p>
                        </div>
                        <div className={cn("text-md leading-[normal] font-semibold tracking-[1px] tabular-nums", 'text-white')}>
                            {cardNumber}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

type CreditCardBackProps = {
  className?: string;
};

const CreditCardBack = ({
  className,
}: CreditCardBackProps) => {
  const originalWidth = 316;
  const originalHeight = 190;

  return (
    <div
      style={{ width: `${originalWidth}px`, height: `${originalHeight}px` }}
      className={cn('relative flex', className)}
    >
      <div
        style={{ width: `${originalWidth}px`, height: `${originalHeight}px` }}
        className={cn(
          'absolute inset-0 rounded-2xl overflow-hidden',
          'border shadow-sm'
        )}
      >
        <div className="absolute -bottom-4 -right-4 grid grid-cols-2 blur-2xl">
                    <div className="size-20 rounded-tl-full bg-pink-500 opacity-70 mix-blend-normal" />
                    <div className="size-20 rounded-tr-full bg-orange-500 opacity-50 mix-blend-normal" />
                    <div className="size-20 rounded-bl-full bg-blue-500 opacity-40 mix-blend-normal" />
                    <div className="size-20 rounded-br-full bg-success-500 opacity-50 mix-blend-normal" />
                </div>
        
        {/* Mag stripe */}
        <div className="relative h-9 w-full bg-black mt-4" />

        {/* Signature strip + CVV */}
        <div className="px-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="h-7 w-full rounded-sm bg-neutral-100 border border-neutral-200" />
            </div>

            <div className="ml-auto">
              <div className="h-7 w-16 rounded-sm bg-neutral-100 border border-neutral-300 flex align-center items-center justify-center">
                <span className="text-lg tabular-nums text-neutral-700">
                  cvv
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fine print */}
        <div className="px-4 mt-3">
          <p className="text-[10px] leading-4 text-neutral-500">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis
            vehicula auctor dapibus. Aliquam erat volutpat. Integer cursus
            volutpat neque sit amet condimentum.
          </p>
        </div>

        {/* Rounded corner accent (subtle) */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5" />
      </div>
    </div>
  );
};

type Overview = {
    userLimit: number;
    subscriptionEnd: string | null;
    employeesCount: number;
    history: Array<{
        id: string;
        planId: string;
        seats: number;
        amountCents: number;
        paidAt: string;
    }>;
};

export default function BillingSection({ data, company }: { data: Overview, company: { id: string, name?: string | null, email?: string | null } }) {
    const currentSeats = data.userLimit ?? 0;
    const currentPlan =
        currentSeats === PLANS.business.seats
            ? PLANS.business
            : currentSeats === PLANS.pro.seats
                ? PLANS.pro
                : currentSeats === PLANS.basic.seats
                    ? PLANS.basic
                    : null;

    const now = new Date();
    const end = data.subscriptionEnd ? new Date(data.subscriptionEnd) : null;
    const isExpired = end ? end < now : true;

    const used = data.employeesCount;
    const steps = currentSeats || 1;

    return (
        <div className="flex flex-1 flex-col space-y-4">
            {/* Row: plan card grows, credit card fixed */}
            <div className="flex flex-col md:flex-row gap-6 items-stretch">
                <section
                    className={cn(
                        'flex-1 min-w-0 rounded-lg border p-4 flex flex-col justify-between',
                        isExpired && 'border-red-500'
                    )}
                >
                    <div>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                Current plan
                                {currentPlan && <StatusBadge expired={isExpired} />}
                            </h2>
                        </div>

                        <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                Plan:{' '}
                                <strong>{currentPlan?.label ?? 'Not subscribed'}</strong>
                                {currentPlan ? ` (${currentSeats} users)` : null}
                            </div>

                            <div>
                                Used: {used}
                                {currentPlan ? ` / ${steps}` : null}
                            </div>

                            <div>
                                {isExpired ? 'Expired on:' : 'Active until:'}{' '}
                                <strong>{end ? format(end, 'yyyy-MM-dd') : '—'}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        {currentPlan && (
                            <CheckoutButton
                                planId={currentPlan.id}
                                className={isExpired ? 'bg-red-600' : 'border border-green-400 hover:bg-green-400'}
                            >
                                Renew {currentPlan.label} Plan
                            </CheckoutButton>
                        )}
                    </div>
                </section>

                {/* Fixed width credit card on md+; hidden on small screens */}
                <div className="hidden md:block">
                    <CreditCardFront cardHolder={company.name ?? 'Default User'} cardExpiration={data.subscriptionEnd ? formatDate(data.subscriptionEnd, 'MM/yy') : '06/28'} />
                </div>
                <div className="hidden md:block">
                    <CreditCardBack />
                </div>
            </div>

            <h2 className="mb-3 text-lg font-semibold">Billing history</h2>
            <div className="flex flex-1 flex-col space-y-4">
                <BillingTable rows={data.history} />
            </div>
        </div>
    );

}
