const OPEN_LIBRARY_BASE_URL = 'https://openlibrary.org';
const OPEN_LIBRARY_COVER_BASE_URL = 'https://covers.openlibrary.org/b/id';

export type OpenLibraryBook = {
  key: string;
  title?: string;
  author_name?: string[];
  author_key?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
  publisher?: string[];
  isbn?: string[];
  number_of_pages_median?: number;
};

export type BookSearchResult = {
  workKey: string;
  title: string;
  author: string;
  authorKey: string;
  firstPublishYear: number | null;
  coverUrl: string | null;
  subjects: string[];
  publishers: string[];
  isbn: string | null;
  pageCount: number | null;
  openLibraryUrl: string;
};

type OpenLibrarySearchResponse = {
  docs?: OpenLibraryBook[];
};

function normalizeWorkKey(key: string): string {
  return key.replace(/^\/?works\//, '');
}

function getOpenLibraryUrl(key: string): string {
  const normalizedKey = normalizeWorkKey(key);
  return `${OPEN_LIBRARY_BASE_URL}/works/${normalizedKey}`;
}

function getCoverUrl(coverId?: number): string | null {
  return coverId ? `${OPEN_LIBRARY_COVER_BASE_URL}/${coverId}-M.jpg` : null;
}

function getSubjects(subjects?: string[]): string[] {
  return (subjects || [])
    .filter((subject) => subject.length <= 32)
    .filter((subject) => !/accessible book|protected daisy|in library|internet archive/i.test(subject))
    .slice(0, 5);
}

export async function searchBooks(queryStr: string): Promise<BookSearchResult[]> {
  try {
    const params = new URLSearchParams({
      q: queryStr,
      limit: '10',
      fields: [
        'key',
        'title',
        'author_name',
        'author_key',
        'first_publish_year',
        'cover_i',
        'subject',
        'publisher',
        'isbn',
        'number_of_pages_median',
      ].join(','),
    });

    const response = await fetch(`${OPEN_LIBRARY_BASE_URL}/search.json?${params.toString()}`);

    if (!response.ok) throw new Error('Failed to search Open Library');

    const data: OpenLibrarySearchResponse = await response.json();
    const books = data.docs || [];

    return books
      .filter((book) => book.key && book.title)
      .map((book) => ({
        workKey: normalizeWorkKey(book.key),
        title: book.title || 'Untitled',
        author: book.author_name?.[0] || 'Unknown Author',
        authorKey: book.author_key?.[0] || '',
        firstPublishYear: book.first_publish_year || null,
        coverUrl: getCoverUrl(book.cover_i),
        subjects: getSubjects(book.subject),
        publishers: (book.publisher || []).slice(0, 3),
        isbn: book.isbn?.[0] || null,
        pageCount: book.number_of_pages_median || null,
        openLibraryUrl: getOpenLibraryUrl(book.key),
      }));
  } catch (error) {
    console.error('Error searching books:', error);
    return [];
  }
}
