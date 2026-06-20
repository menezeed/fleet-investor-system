import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AssignmentsTable, type AssignmentRow } from '@/components/tables/assignments-table';
import { Button } from '@/components/ui/button';

export default async function AssignmentsPage() {
  const supabase = createClient();

  const { data: assignments } = await supabase
    .from('vehicle_assignments')
    .select('id, start_date, end_date, monthly_rental_value, vehicles(plate_number), drivers(full_name)')
    .order('start_date', { ascending: false })
    .returns<AssignmentRow[]>();

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

      <AssignmentsTable assignments={assignments ?? []} emptyMessage="Nenhuma alocação encontrada" />
    </div>
  );
}
