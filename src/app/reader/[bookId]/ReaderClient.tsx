'use client';

import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Lightbulb,
} from 'lucide-react';

import type { Book } from '@/lib/types';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

// Configure the PDF.js worker.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const options = {
  cMapUrl: '/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: '/standard_fonts/',
};

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

  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState(1);
  const [note, setNote] = useState('');
  const [isAiHelperOpen, setIsAiHelperOpen] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);

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

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }: PDFDocumentProxy) => {
    setNumPages(nextNumPages);
    setPdfLoading(false);
  };
  
  const onPageRenderSuccess = useCallback(async (page: PDFPageProxy) => {
    try {
      const textContent = await page.getTextContent();
      pageTextRef.current = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
    } catch (error) {
      console.error('Failed to get text content from page', error);
      pageTextRef.current = 'Could not extract text from this page.';
    }
  }, []);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNote = e.target.value;
    setNote(newNote);
    updateNote(book.id, pageNumber, newNote);
  };

  const handleAiHelp = async () => {
    if (!pageTextRef.current.trim()) {
      toast({
        variant: 'destructive',
        title: 'Unable to help',
        description: 'Could not find any text on this page to explain.',
      });
      return;
    }
    setIsAiHelperOpen(true);
    setIsAiLoading(true);
    setAiExplanation('');
    try {
      const result = await explainDifficultPage({ pageContent: pageTextRef.current });
      setAiExplanation(result.explanation);
    } catch (error) {
      console.error(error);
      setAiExplanation('Sorry, an error occurred while trying to explain this page.');
      toast({
        variant: 'destructive',
        title: 'AI Helper Error',
        description: 'Could not generate an explanation.',
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
      {/* PDF Viewer */}
      <div className="flex flex-col items-center bg-card rounded-lg p-4 overflow-hidden">
        <div className="flex-grow w-full flex items-center justify-center overflow-auto">
          <Document
            file={book.pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            options={options}
            loading={<Skeleton className="w-[80vw] md:w-full aspect-[8.5/11] max-h-full" />}
            onLoadError={(error) => {
                console.error("PDF Load Error:", error);
                toast({
                    variant: "destructive",
                    title: "Error loading PDF",
                    description: "Could not load the book. Please try again later.",
                });
                setPdfLoading(false);
            }}
          >
            {!pdfLoading && (
              <Page
                pageNumber={pageNumber}
                onRenderSuccess={onPageRenderSuccess}
                renderAnnotationLayer={true}
                renderTextLayer={true}
                width={Math.min(window.innerWidth * 0.9, 800)}
              />
            )}
          </Document>
        </div>
        {!pdfLoading && numPages && (
            <div className="flex items-center gap-4 mt-4">
            <Button onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
                <ChevronLeft /> Previous
            </Button>
            <p className="text-sm font-medium">
                Page {pageNumber} of {numPages}
            </p>
            <Button onClick={() => changePage(1)} disabled={pageNumber >= numPages}>
                Next <ChevronRight />
            </Button>
            </div>
        )}
      </div>

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
