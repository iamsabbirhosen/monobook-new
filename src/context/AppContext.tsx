'use client';

import type { Book } from '@/lib/types';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

type Notes = { [bookId: string]: { [page: number]: string } };
type Stats = {
  totalTimeSeconds: number;
  pagesRead: number;
};

interface AppContextType {
  library: string[];
  notes: Notes;
  stats: Stats;
  isHydrated: boolean;
  addBookToLibrary: (bookId: string) => void;
  isBookInLibrary: (bookId: string) => boolean;
  updateNote: (bookId: string, page: number, content: string) => void;
  getNote: (bookId: string, page: number) => string;
  logReadingTime: (seconds: number) => void;
  logPageRead: (bookId: string, page: number) => void;
  getNotesTakenCount: () => number;
  getPagesReadCount: () => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const isServer = typeof window === 'undefined';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [library, setLibrary] = useState<string[]>([]);
  const [notes, setNotes] = useState<Notes>({});
  const [stats, setStats] = useState<Stats>({
    totalTimeSeconds: 0,
    pagesRead: 0,
  });
  const [readPages, setReadPages] = useState<Record<string, Set<number>>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (isServer) return;
    try {
      const storedLibrary = localStorage.getItem('scholarverse-library');
      const storedNotes = localStorage.getItem('scholarverse-notes');
      const storedStats = localStorage.getItem('scholarverse-stats');
      const storedReadPages = localStorage.getItem('scholarverse-read-pages');

      if (storedLibrary) setLibrary(JSON.parse(storedLibrary));
      if (storedNotes) setNotes(JSON.parse(storedNotes));
      if (storedStats) setStats(JSON.parse(storedStats));
      if (storedReadPages) {
        const parsed = JSON.parse(storedReadPages);
        const readPagesSets: Record<string, Set<number>> = {};
        for (const bookId in parsed) {
          readPagesSets[bookId] = new Set(parsed[bookId]);
        }
        setReadPages(readPagesSets);
      }
    } catch (error) {
      console.error('Failed to load data from localStorage', error);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isServer) {
      localStorage.setItem('scholarverse-library', JSON.stringify(library));
    }
  }, [library, isHydrated]);

  useEffect(() => {
    if (isHydrated && !isServer) {
      localStorage.setItem('scholarverse-notes', JSON.stringify(notes));
    }
  }, [notes, isHydrated]);

  useEffect(() => {
    if (isHydrated && !isServer) {
      localStorage.setItem('scholarverse-stats', JSON.stringify(stats));
    }
  }, [stats, isHydrated]);

  useEffect(() => {
    if (isHydrated && !isServer) {
      const serializableReadPages: Record<string, number[]> = {};
      for (const bookId in readPages) {
        serializableReadPages[bookId] = Array.from(readPages[bookId]);
      }
      localStorage.setItem('scholarverse-read-pages', JSON.stringify(serializableReadPages));
      setStats(s => ({...s, pagesRead: getPagesReadCount()}));
    }
  }, [readPages, isHydrated]);

  const addBookToLibrary = useCallback((bookId: string) => {
    setLibrary(prev => (prev.includes(bookId) ? prev : [...prev, bookId]));
  }, []);

  const isBookInLibrary = useCallback((bookId: string) => library.includes(bookId), [library]);

  const updateNote = useCallback((bookId: string, page: number, content: string) => {
    setNotes(prev => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        [page]: content,
      },
    }));
  }, []);

  const getNote = useCallback((bookId: string, page: number) => {
    return notes[bookId]?.[page] || '';
  }, [notes]);

  const logReadingTime = useCallback((seconds: number) => {
    setStats(prev => ({
      ...prev,
      totalTimeSeconds: prev.totalTimeSeconds + seconds,
    }));
  }, []);

  const getPagesReadCount = useCallback(() => {
    return Object.values(readPages).reduce((acc, bookPages) => acc + bookPages.size, 0);
  }, [readPages]);

  const logPageRead = useCallback((bookId: string, page: number) => {
      setReadPages(prev => {
          const newReadPages = {...prev};
          if (!newReadPages[bookId]) {
              newReadPages[bookId] = new Set();
          }
          if (newReadPages[bookId].has(page)) {
              return prev; // No change if page already read
          }
          newReadPages[bookId].add(page);
          return newReadPages;
      });
  }, []);

  const getNotesTakenCount = useCallback(() => {
    return Object.values(notes).reduce((total, bookNotes) => {
      return total + Object.values(bookNotes).filter(note => note.trim() !== '').length;
    }, 0);
  }, [notes]);

  const value = useMemo(() => ({
    library,
    notes,
    stats: { ...stats, pagesRead: getPagesReadCount() },
    isHydrated,
    addBookToLibrary,
    isBookInLibrary,
    updateNote,
    getNote,
    logReadingTime,
    logPageRead,
    getNotesTakenCount,
    getPagesReadCount
  }), [library, notes, stats, isHydrated, addBookToLibrary, isBookInLibrary, updateNote, getNote, logReadingTime, logPageRead, getNotesTakenCount, getPagesReadCount]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
