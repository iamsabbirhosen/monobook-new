'use client';

import { books } from "@/lib/books";
import { notFound } from "next/navigation";
import dynamic from 'next/dynamic';
import Loading from "./loading";

const ReaderClient = dynamic(() => import('./ReaderClient'), {
  ssr: false,
  loading: () => <Loading />,
});

type ReaderPageProps = {
  params: {
    bookId: string;
  };
};

export default function ReaderPage({ params }: ReaderPageProps) {
  const book = books.find((b) => b.id === params.bookId);

  // In a real app, you might want to fetch this data in a server component
  // and pass it down, but for simplicity, we'll keep it here.
  // notFound() can still be used in client components.
  if (!book) {
    notFound();
  }

  return <ReaderClient book={book} />;
}
