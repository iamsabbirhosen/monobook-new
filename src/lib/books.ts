import type { Book } from './types';

export const books: Book[] = [
  {
    id: '1',
    title: 'বায়োলজি ১ম পত্র',
    author: 'মোঃ সাব্বির হোসেন',
    price: 25.99,
    coverImageId: 'computer-programming-cover',
    pdfUrl: 'src/booksPDF/biology.pdf',
  },
  {
    id: '2',
    title: 'Introduction to Quantum Mechanics',
    author: 'David J. Griffiths',
    price: 35.50,
    coverImageId: 'quantum-mechanics-cover',
    pdfUrl: 'https://www.africau.edu/images/default/sample.pdf',
  },
  {
    id: '3',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    price: 18.00,
    coverImageId: 'sapiens-cover',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: '4',
    title: 'Organic Chemistry',
    author: 'Paula Yurkanis Bruice',
    price: 45.99,
    coverImageId: 'organic-chemistry-cover',
    pdfUrl: 'https://www.africau.edu/images/default/sample.pdf',
  },
  {
    id: '5',
    title: 'Cosmos',
    author: 'Carl Sagan',
    price: 21.99,
    coverImageId: 'cosmos-cover',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
];
