'use client';

import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  column: string | null;
  direction: SortDirection;
}

/**
 * CR-010: generic sortable-grid behavior. Tracks which column is sorted and
 * in which direction; clicking the same column header toggles direction,
 * clicking a different column switches to it (ascending by default).
 *
 * Server-backed lists (Cash Flow, Events, Assignments) pass `sort.column`/
 * `sort.direction` into their Supabase `.order(...)` call. Smaller,
 * fully-loaded lists can instead use `sortRows` to sort client-side with
 * the same state/UI, without an extra round-trip.
 */
export function useSortableState(initial: SortState = { column: null, direction: 'asc' }) {
  const [sort, setSort] = useState<SortState>(initial);

  function toggleSort(column: string) {
    setSort((prev) => {
      if (prev.column !== column) return { column, direction: 'asc' };
      return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
  }

  return { sort, toggleSort, setSort };
}

/**
 * Client-side sort helper for already-loaded arrays. Handles text, number,
 * date (ISO strings), and currency (plain numbers) uniformly via a
 * value-extractor function, since comparison logic is the same for all of
 * them once you have the raw comparable value.
 */
export function sortRows<T>(rows: T[], sort: SortState, getValue: (row: T, column: string) => unknown): T[] {
  if (!sort.column) return rows;

  const sorted = [...rows].sort((a, b) => {
    const va = getValue(a, sort.column as string);
    const vb = getValue(b, sort.column as string);

    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;

    if (typeof va === 'number' && typeof vb === 'number') return va - vb;
    return String(va).localeCompare(String(vb), 'pt-BR', { numeric: true });
  });

  return sort.direction === 'desc' ? sorted.reverse() : sorted;
}

/** Memoized convenience wrapper around sortRows for use directly in render. */
export function useSortedRows<T>(rows: T[], sort: SortState, getValue: (row: T, column: string) => unknown): T[] {
  return useMemo(() => sortRows(rows, sort, getValue), [rows, sort, getValue]);
}
