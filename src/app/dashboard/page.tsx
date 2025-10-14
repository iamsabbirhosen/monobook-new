'use client';

import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, FileText, StickyNote, Activity } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { useMemo } from 'react';

export default function DashboardPage() {
  const { stats, getNotesTakenCount, isHydrated } = useAppContext();
  
  const notesTaken = getNotesTakenCount();

  const productivityScore = useMemo(() => {
    if (!stats.totalTimeSeconds) return 0;
    const timeInMinutes = stats.totalTimeSeconds / 60;
    // Simple score: pages read per hour + notes taken
    const pagesPerHour = timeInMinutes > 0 ? (stats.pagesRead / timeInMinutes) * 60 : 0;
    return Math.round(pagesPerHour + notesTaken * 2);
  }, [stats.totalTimeSeconds, stats.pagesRead, notesTaken]);

  const metrics = [
    {
      title: 'Time Spent Reading',
      value: isHydrated ? formatTime(stats.totalTimeSeconds) : '00:00',
      icon: Clock,
      description: 'Total time spent across all books.'
    },
    {
      title: 'Pages Read',
      value: isHydrated ? stats.pagesRead.toLocaleString() : '0',
      icon: FileText,
      description: 'Total number of unique pages viewed.'
    },
    {
      title: 'Notes Taken',
      value: isHydrated ? notesTaken.toLocaleString() : '0',
      icon: StickyNote,
      description: 'Total number of notes written.'
    },
    {
      title: 'Productivity Score',
      value: isHydrated ? productivityScore.toLocaleString() : '0',
      icon: Activity,
      description: 'A score based on reading and note-taking.'
    }
  ];

  if (!isHydrated) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading your dashboard...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-4xl font-bold mb-8 text-center">Your Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
