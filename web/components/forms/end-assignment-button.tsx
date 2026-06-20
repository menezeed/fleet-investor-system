'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function EndAssignmentButton({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleEnd() {
    if (!confirm('Encerrar esta alocação hoje? O veículo ficará disponível para nova alocação.')) {
      return;
    }

    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from('vehicle_assignments')
      .update({ end_date: today })
      .eq('id', assignmentId);

    setLoading(false);

    if (error) {
      alert(`Erro ao encerrar: ${error.message}`);
      return;
    }

    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleEnd} disabled={loading}>
      Encerrar
    </Button>
  );
}
