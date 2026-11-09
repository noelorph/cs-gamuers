import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppNav } from '@/components/app-nav';
import { SidebarProvider } from '@/components/ui/sidebar';

window.matchMedia = ((query: string) => ({
  matches: false,
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
})) as unknown as typeof window.matchMedia;

let pathname = '/faculty/courses/abc';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

const items = [
  { label: 'Home', href: '/faculty' },
  { label: 'Course drafts', href: '/faculty/courses' },
];

function renderNav() {
  render(
    <SidebarProvider>
      <AppNav items={items} />
    </SidebarProvider>
  );
}

afterEach(cleanup);

describe('AppNav', () => {
  it('marks only the most specific matching link as current', () => {
    pathname = '/faculty/courses/abc';
    renderNav();
    expect(screen.getByRole('link', { name: 'Course drafts' }).getAttribute('aria-current')).toBe(
      'page'
    );
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBeNull();
  });

  it('marks the exact route as current', () => {
    pathname = '/faculty';
    renderNav();
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBe('page');
  });
});
