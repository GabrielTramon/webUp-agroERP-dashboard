'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { getInitials } from '@/lib/utils';

interface Props {
  userName: string;
  userSubtitle: string;
}

export function DashboardHeader({ userName, userSubtitle }: Props) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme') === 'dark';
    setDark(saved);
    document.documentElement.classList.toggle('dark', saved);
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-1">
        <SidebarTrigger />
        <Button variant="ghost" size="icon" onClick={toggleDark}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      {userName && (
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end leading-tight min-w-0">
            <span className="text-sm font-semibold truncate max-w-50">{userName}</span>
            <span className="text-xs text-muted-foreground truncate max-w-50">
              {userSubtitle}
            </span>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground ring-1 ring-border">
            {getInitials(userName)}
          </div>
        </div>
      )}
    </header>
  );
}
