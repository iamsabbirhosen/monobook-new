"use client";

import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { books } from "@/lib/books";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center py-16">
        <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">
          Welcome to {APP_NAME}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Unlock the doors to knowledge. Browse, buy, and read academic books at a fraction of the cost, with powerful AI-driven study tools at your fingertips.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="#browse">Browse Books</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/library">Go to Library</Link>
          </Button>
        </div>
      </section>

      <section id="browse" className="py-16">
        <h2 className="font-headline text-4xl font-bold text-center mb-10">Available Books</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>
    </div>
  );
}
