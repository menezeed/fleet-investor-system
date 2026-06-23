'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AssignmentsTable, type AssignmentRow } from '@/components/tables/assignments-table';
import { Button } from '@/components/ui/button';
import { useSortableState } from '@/lib/utils/use-sortable';

// CR-010 (v1.3): sortable grid — clicking a column header toggles
// ascending/descending and re-queries the server in that order.
export default function AssignmentsPage() {
  const supabase = createClient();
  const { sort, toggleSort } = useSortableState({ column: 'start_date', direction: 'desc' });
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('vehicle_assignments_list')
        .select('*')
        .order(sort.column ?? 'start_date', { ascending: sort.direction === 'asc' })
        .returns<AssignmentRow[]>();
      setAssignments(data ?? []);
      setLoading(false);
    }
    load();
  }, [sort]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Alocações</h1>
        <Link href="/assignments/new">
          <Button>
            <Plus className="h-4 w-4" />
            Criar
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <AssignmentsTable
          assignments={assignments}
          emptyMessage="Nenhuma alocação encontrada"
          sort={sort}
          onSortChange={toggleSort}
        />
      )}
    </div>
  );
}
