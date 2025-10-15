'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Lightbulb,
} from 'lucide-react';

import type { Book } from '@/lib/types';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImageReader } from '@/components/ImageReader';
import { useToast } from '@/hooks/use-toast';
import { explainDifficultPage } from '@/ai/flows/explain-difficult-page';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';



export default function ReaderClient({ book }: { book: Book }) {
  const {
    getNote,
    updateNote,
    logReadingTime,
    logPageRead,
    isBookInLibrary,
    isHydrated,
  } = useAppContext();
  const { toast } = useToast();

  const [pageNumber, setPageNumber] = useState(1);
  const [note, setNote] = useState('');
  const [isAiHelperOpen, setIsAiHelperOpen] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(999); // Set to a high number, ImageReader will find actual count

  const pageTextRef = useRef<string>('');
  const readingSinceRef = useRef<number>(Date.now());

  const hasAccess = isBookInLibrary(book.id);

  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = (Date.now() - readingSinceRef.current) / 1000;
      if (seconds > 0) {
        logReadingTime(seconds);
        readingSinceRef.current = Date.now();
      }
    }, 5000); // Log time every 5 seconds

    return () => {
      clearInterval(interval);
      // Log any remaining time on unmount
      const seconds = (Date.now() - readingSinceRef.current) / 1000;
      if (seconds > 0) logReadingTime(seconds);
    };
  }, [logReadingTime]);

  useEffect(() => {
    if (hasAccess) {
      setNote(getNote(book.id, pageNumber));
      logPageRead(book.id, pageNumber);
    }
  }, [pageNumber, book.id, getNote, hasAccess, logPageRead]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNote = e.target.value;
    setNote(newNote);
    updateNote(book.id, pageNumber, newNote);
  };

  const handleAiHelp = async () => {
    setIsAiHelperOpen(true);
    setIsAiLoading(true);
    setAiExplanation('');
    try {
      // Always use relative path for API
      const imageUrl = `/pdfbooks/${book.id}/${pageNumber}.jpg`;
      console.log('Processing image:', imageUrl);
      const prompt = "Please analyze and explain this Bengali textbook page with translation and examples";
      
      console.log('Sending request to analyze image:', imageUrl);
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          prompt,
          apiKey: 'AIzaSyC7TooMO4Hdn7szn_5m9UmCNFcfkyYPqYQ'
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        const errorText = contentType?.includes('application/json') 
          ? (await response.json()).error 
          : await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(errorText || 'Failed to get explanation');
      }

      const result = await response.json();
      console.log('API Response:', result);

      if (!result?.explanation) {
        throw new Error('No explanation received from AI');
      }
      
      setAiExplanation(result.explanation);
    } catch (error) {
      console.error('AI Helper Error:', error); // Detailed error logging
      setAiExplanation('Sorry, an error occurred while trying to explain this page.');
      toast({
        variant: 'destructive',
        title: 'AI Helper Error',
        description: error instanceof Error ? error.message : 'Could not generate an explanation',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  }

  if (isHydrated && !hasAccess) {
    return (
      <div className="container mx-auto flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="mt-2 text-muted-foreground">You do not own this book. Please purchase it to read.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[1fr_350px] gap-4 p-4 h-[calc(100vh-3.5rem)]">
      {/* Reader View */}
      <ImageReader
        bookId={book.id}
        totalPages={totalPages}
        onPageChange={(page) => {
          setPageNumber(page);
          if (hasAccess) {
            logPageRead(book.id, page);
          }
        }}
      />

      {/* Sidebar for Notes and AI */}
      <div className="hidden md:flex flex-col gap-4">
        <div className="bg-card p-4 rounded-lg flex-grow flex flex-col">
            <h3 className="font-headline text-lg font-semibold mb-2">My Notes</h3>
            <Textarea
                placeholder={`Notes for page ${pageNumber}...`}
                value={note}
                onChange={handleNoteChange}
                className="flex-grow resize-none text-base"
            />
        </div>
        <div className="bg-card p-4 rounded-lg">
          <h3 className="font-headline text-lg font-semibold mb-2">Study Tools</h3>
          <Button className="w-full mb-2" onClick={handleAiHelp}>
            <Sparkles className="mr-2 h-4 w-4" /> Need help with this page?
          </Button>
          <Button variant="outline" className="w-full" disabled>
            <Lightbulb className="mr-2 h-4 w-4" /> Highlight (UI Only)
          </Button>
        </div>
      </div>

      {/* AI Helper Dialog */}
      <Dialog open={isAiHelperOpen} onOpenChange={setIsAiHelperOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
              <Sparkles className="text-primary" /> AI Study Helper
            </DialogTitle>
            <DialogDescription>
              Here's a simplified explanation of the content on page {pageNumber}.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-6">
            {isAiLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-[80%]" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-body text-base">
                {aiExplanation}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
