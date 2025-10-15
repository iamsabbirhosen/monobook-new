'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ImageReaderProps {
  bookId: string;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

export function ImageReader({ bookId, totalPages, onPageChange }: ImageReaderProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [actualTotalPages, setActualTotalPages] = useState(totalPages);

  useEffect(() => {
    // Function to check if an image exists
    const checkImageExists = async (pageNum: number): Promise<boolean> => {
      try {
        const response = await fetch(`/pdfbooks/${bookId}/${pageNum}.jpg`, { method: 'HEAD' });
        return response.ok;
      } catch {
        return false;
      }
    };

    // Function to find the actual total number of pages
    const findTotalPages = async () => {
      let page = 1;
      while (await checkImageExists(page)) {
        page++;
      }
      setActualTotalPages(page - 1);
    };

    findTotalPages();
  }, [bookId]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= actualTotalPages) {
      setCurrentPage(newPage);
      setIsLoading(true);
      onPageChange?.(newPage);
    }
  };

  return (
    <div className="flex flex-col items-center bg-card rounded-lg p-4 overflow-hidden">
      <div className="flex-grow w-full flex items-center justify-center relative h-[calc(100vh-12rem)]">
        {isLoading && (
          <Skeleton className="w-full h-full absolute inset-0" />
        )}
        <div className="relative w-full h-full">
          <Image
            src={`/pdfbooks/${bookId}/${currentPage}.jpg`}
            alt={`Page ${currentPage}`}
            fill
            style={{
              objectFit: 'contain',
              opacity: isLoading ? 0 : 1
            }}
            priority
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 mt-4">
        <Button 
          onClick={() => handlePageChange(currentPage - 1)} 
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="mr-2" /> Previous
        </Button>
        <p className="text-sm font-medium">
          Page {currentPage} of {actualTotalPages}
        </p>
        <Button 
          onClick={() => handlePageChange(currentPage + 1)} 
          disabled={currentPage >= actualTotalPages}
        >
          Next <ChevronRight className="ml-2" />
        </Button>
      </div>
    </div>
  );
}