'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FieldWrapper, Input } from '@/components/ui/form-fields';
import { Card, CardContent } from '@/components/ui/card';
import type { LookupItem } from '@/types/database';
import type { LookupConfig } from '@/lib/lookups/config';

interface LookupManagerProps {
  config: LookupConfig;
  initialItems: LookupItem[];
}

export function LookupManager({ config, initialItems }: LookupManagerProps) {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<LookupItem | 'new' | null>(null);
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startCreate() {
    setEditing('new');
    setLabel('');
    setError(null);
  }

  function startEdit(item: LookupItem) {
    setEditing(item);
    setLabel(item.label);
    setError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setLabel('');
    setError(null);
  }

  async function handleSave() {
    const trimmed = label.trim();
    if (!trimmed) {
      setError('Informe um nome');
      return;
    }
    setSaving(true);
    setError(null);

    if (editing === 'new') {
      const code = trimmed
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/(^_|_$)/g, '');
      const maxSort = items.reduce((max, i) => Math.max(max, i.sort_order), 0);

      const { data, error: insertError } = await supabase
        .from(config.table)
        .insert({ code, label: trimmed, sort_order: maxSort + 1 })
        .select()
        .single();

      setSaving(false);
      if (insertError) {
        setError(
          insertError.message.includes('unique')
            ? 'Já existe uma opção com esse nome.'
            : insertError.message
        );
        return;
      }
      setItems((prev) => [...prev, data as LookupItem]);
    } else if (editing) {
      const { data, error: updateError } = await supabase
        .from(config.table)
        .update({ label: trimmed })
        .eq('id', editing.id)
        .select()
        .single();

      setSaving(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setItems((prev) => prev.map((i) => (i.id === editing.id ? (data as LookupItem) : i)));
    }

    cancelEdit();
    router.refresh();
  }

  async function toggleActive(item: LookupItem) {
    const { data, error: toggleError } = await supabase
      .from(config.table)
      .update({ is_active: !item.is_active })
      .eq('id', item.id)
      .select()
      .single();

    if (toggleError) {
      alert(toggleError.message);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === item.id ? (data as LookupItem) : i)));
    router.refresh();
  }

  async function handleDelete(item: LookupItem) {
    if (!confirm(`Excluir "${item.label}"? Essa ação não pode ser desfeita.`)) return;

    const { error: deleteError } = await supabase.from(config.table).delete().eq('id', item.id);

    if (deleteError) {
      // Postgres FK violation code is 23503 — raised when this option is still in use
      if (deleteError.code === '23503') {
        alert(
          `Não é possível excluir "${item.label}" porque já existem registros usando esta opção. ` +
            `Você pode desativá-la em vez de excluir, para que ela pare de aparecer em novos cadastros.`
        );
      } else {
        alert(deleteError.message);
      }
      return;
    }

    setItems((prev) => prev.filter((i) => i.id !== item.id));
    router.refresh();
  }

  const columns: Column<LookupItem>[] = [
    {
      header: '',
      accessor: () => <GripVertical className="h-4 w-4 text-muted-foreground/40" />,
      className: 'w-6',
    },
    { header: 'Nome', accessor: (i) => <span className="font-medium">{i.label}</span> },
    {
      header: 'Status',
      align: 'center',
      accessor: (i) => (
        <button onClick={() => toggleActive(i)}>
          <Badge variant={i.is_active ? 'success' : 'default'}>{i.is_active ? 'Ativo' : 'Inativo'}</Badge>
        </button>
      ),
    },
    {
      header: 'Ações',
      align: 'right',
      accessor: (i) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => startEdit(i)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(i)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{config.description}</p>
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4" />
          Nova Opção
        </Button>
      </div>

      {editing && (
        <Card>
          <CardContent className="flex items-end gap-3 pt-4">
            <FieldWrapper label="Nome" error={error ?? undefined} className="flex-1">
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Pagamento de Locação"
                autoFocus
              />
            </FieldWrapper>
            <Button variant="outline" onClick={cancelEdit} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              Salvar
            </Button>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        rows={[...items].sort((a, b) => a.sort_order - b.sort_order)}
        keyExtractor={(i) => i.id}
        emptyMessage="Nenhuma opção cadastrada"
      />
    </div>
  );
}
