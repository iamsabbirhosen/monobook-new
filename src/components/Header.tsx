'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Library, LayoutDashboard, Home } from 'lucide-react';

import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Logo } from './icons/Logo';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/library', label: 'My Library', icon: Library },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block font-headline text-lg tracking-wider">
              {APP_NAME}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center space-x-2 md:flex">
            {navItems.map((item) => (
              <Button
                key={item.label}
                asChild
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className="font-semibold"
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px]">
                <div className="p-4 pt-12">
                  <nav className="flex flex-col space-y-2">
                    {navItems.map((item) => (
                      <SheetClose key={item.label} asChild>
                       <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 rounded-md px-3 py-2 text-base font-semibold transition-colors',
                            pathname === item.href
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
