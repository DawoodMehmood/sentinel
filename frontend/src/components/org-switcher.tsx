'use client';

import { Check, ChevronsUpDown, GalleryVerticalEnd } from 'lucide-react';
import * as React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

interface Tenant {
  id: string;
  name: string;
}

export function OrgSwitcher({
  defaultTenant,
  onTenantSwitch
}: {
  defaultTenant: string;
  onTenantSwitch?: (tenantId: string) => void;
}) {

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {/* <DropdownMenu> */}
          {/* <DropdownMenuTrigger asChild> */}
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='bg-muted text-secondary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                <GalleryVerticalEnd className='size-4' />
              </div>
              <div className='flex flex-col gap-0.5 leading-none'>
                <span className='font-semibold'>Sentinel</span>
                <span className=''>{defaultTenant}</span>
              </div>
              {/* <ChevronsUpDown className='ml-auto' /> */}
            </SidebarMenuButton>
          {/* </DropdownMenuTrigger> */}
          {/* <DropdownMenuContent
            className='w-[--radix-dropdown-menu-trigger-width]'
            align='start'
          >
            {tenants.map((tenant) => (
              <DropdownMenuItem
                key={tenant.id}
                onSelect={() => handleTenantSwitch(tenant)}
              >
                {tenant.name}{' '}
                {tenant.id === selectedTenant.id && (
                  <Check className='ml-auto' />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent> */}
        {/* </DropdownMenu> */}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
