'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { LookupItem } from '@/types/database';

/**
 * Fetches active options from a lookup table (lookup_vehicle_statuses, etc),
 * ordered by sort_order. Used to populate <Select> options dynamically
 * instead of hardcoding them, so admins can manage the list from Settings.
 *
 * If `currentValueId` is provided and points to an option that has since
 * been deactivated, that option is still included (so editing an existing
 * record doesn't silently lose its current value from the dropdown).
 */
export function useLookupOptions(table: string, currentValueId?: string | null) {
  const [options, setOptions] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from(table)
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .returns<LookupItem[]>();

      let result = data ?? [];

      if (currentValueId && !result.some((o) => o.id === currentValueId)) {
        const { data: currentItem } = await supabase
          .from(table)
          .select('*')
          .eq('id', currentValueId)
          .maybeSingle<LookupItem>();
        if (currentItem) {
          result = [...result, currentItem].sort((a, b) => a.sort_order - b.sort_order);
        }
      }

      if (active) {
        setOptions(result);
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [table, currentValueId]);

  return { options, loading };
}
