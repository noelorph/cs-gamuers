'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export type NavItem = { label: string; href: string };

export function AppNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  if (items.length === 0) return null;
  // The most specific matching link is current, so a parent link is not also marked.
  const current = items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={item === current}>
              <Link
                href={item.href}
                aria-current={item === current ? 'page' : undefined}
                onClick={() => setOpenMobile(false)}
              >
                {item.label}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
