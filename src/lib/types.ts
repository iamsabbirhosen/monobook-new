import type { PlaceHolderImages } from './placeholder-images';

export type Book = {
  id: string;
  title: string;
  author: string;
  price: number;
  coverImageId: (typeof PlaceHolderImages)[number]['id'];
  pdfUrl: string;
};
