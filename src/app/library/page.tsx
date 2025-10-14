'use client';

import { BookCard } from '@/components/BookCard';
import { useAppContext } from '@/context/AppContext';
import { books } from '@/lib/books';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LibraryPage() {
  const { library, isHydrated } = useAppContext();
  const purchasedBooks = books.filter((book) => library.includes(book.id));

  if (!isHydrated) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading your library...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-4xl font-bold mb-8 text-center">My Library</h1>
      {purchasedBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {purchasedBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-2xl font-semibold text-muted-foreground">Your library is empty.</h2>
          <p className="mt-2 text-muted-foreground">Start by browsing our collection and adding books.</p>
          <Button asChild className="mt-6">
            <Link href="/">Browse Books</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
