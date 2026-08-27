export const QURAN_TOTAL_PAGES = 604;

const JUZ_STARTS = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402,
  422, 442, 462, 482, 502, 522, 542, 562, 582,
] as const;

export function clampPage(page: number): number {
  if (!Number.isFinite(page) || page < 1) return 1;
  if (page > QURAN_TOTAL_PAGES) return QURAN_TOTAL_PAGES;
  return Math.floor(page);
}

export function juzForPage(page: number): number {
  const p = clampPage(page);
  let juz = 1;
  for (let i = 0; i < JUZ_STARTS.length; i++) {
    if (p >= JUZ_STARTS[i]!) juz = i + 1;
    else break;
  }
  return juz;
}

export function khatmPercent(currentPage: number): number {
  const p = clampPage(currentPage);
  return Math.round(((p - 1) / QURAN_TOTAL_PAGES) * 100);
}

export type Bookmark = {
  currentPage: number;
  khatmsCompleted: number;
};

export type AdvanceResult = Bookmark & {
  fromPage: number;
  toPage: number;
};

export function advanceBookmark({
  currentPage,
  khatmsCompleted,
  pagesRead,
}: Bookmark & { pagesRead: number }): AdvanceResult {
  const start = clampPage(currentPage);
  const khatms = Math.max(0, Math.floor(khatmsCompleted));
  if (!Number.isFinite(pagesRead) || pagesRead <= 0) {
    return { currentPage: start, khatmsCompleted: khatms, fromPage: start, toPage: start };
  }

  let page = start;
  let completed = khatms;
  let lastPage = start;
  const count = Math.floor(pagesRead);

  for (let i = 0; i < count; i++) {
    lastPage = page;
    if (page === QURAN_TOTAL_PAGES) {
      page = 1;
      completed += 1;
    } else {
      page += 1;
    }
  }

  return {
    currentPage: page,
    khatmsCompleted: completed,
    fromPage: start,
    toPage: lastPage,
  };
}

export function readingRange(fromPage: number, toPage: number): string {
  const from = clampPage(fromPage);
  const to = clampPage(toPage);
  if (from === to) return `p. ${from}`;
  if (to < from) return `pp. ${from}–${QURAN_TOTAL_PAGES}, 1–${to}`;
  return `pp. ${from}–${to}`;
}
