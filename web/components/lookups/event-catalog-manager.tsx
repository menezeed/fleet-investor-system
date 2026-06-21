'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FieldWrapper, Input } from '@/components/ui/form-fields';
import { Card, CardContent } from '@/components/ui/card';
import type { EventCatalogItem } from '@/types/database';

interface EventCatalogManagerProps {
  initialItems: EventCatalogItem[];
}

/**
 * CR-005: dedicated manager for the Event Catalog (Name, Description,
 * Frequency — free text, no validation per the CR). Separate from the
 * generic LookupManager since this lookup table has extra fields.
 */
export function EventCatalogManager({ initialItems }: EventCatalogManagerProps) {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<EventCatalogItem | 'new' | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startCreate() {
    setEditing('new');
    setName('');
    setDescription('');
    setFrequency('');
    setError(null);
  }

  function startEdit(item: EventCatalogItem) {
    setEditing(item);
    setName(item.label);
    setDescription(item.description ?? '');
    setFrequency(item.frequency ?? '');
    setError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setError(null);
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Informe um nome');
      return;
    }
    setSaving(true);
    setError(null);

    if (editing === 'new') {
      const code = trimmedName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/(^_|_$)/g, '');
      const maxSort = items.reduce((max, i) => Math.max(max, i.sort_order), 0);

      const { data, error: insertError } = await supabase
        .from('lookup_expense_types')
        .insert({
          code,
          label: trimmedName,
          description: description.trim() || null,
          frequency: frequency.trim() || null,
          sort_order: maxSort + 1,
        })
        .select()
        .single();

      setSaving(false);
      if (insertError) {
        setError(insertError.message.includes('unique') ? 'Já existe um item com esse nome.' : insertError.message);
        return;
      }
      setItems((prev) => [...prev, data as EventCatalogItem]);
    } else if (editing) {
      const { data, error: updateError } = await supabase
        .from('lookup_expense_types')
        .update({
          label: trimmedName,
          description: description.trim() || null,
          frequency: frequency.trim() || null,
        })
        .eq('id', editing.id)
        .select()
        .single();

      setSaving(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setItems((prev) => prev.map((i) => (i.id === editing.id ? (data as EventCatalogItem) : i)));
    }

    cancelEdit();
    router.refresh();
  }

  async function toggleActive(item: EventCatalogItem) {
    const { data, error: toggleError } = await supabase
      .from('lookup_expense_types')
      .update({ is_active: !item.is_active })
      .eq('id', item.id)
      .select()
      .single();

    if (toggleError) {
      alert(toggleError.message);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === item.id ? (data as EventCatalogItem) : i)));
    router.refresh();
  }

  async function handleDelete(item: EventCatalogItem) {
    if (!confirm(`Excluir "${item.label}"? Essa ação não pode ser desfeita.`)) return;

    const { error: deleteError } = await supabase.from('lookup_expense_types').delete().eq('id', item.id);

    if (deleteError) {
      if (deleteError.code === '23503') {
        alert(
          `Não é possível excluir "${item.label}" porque já existem despesas ou eventos usando este tipo. ` +
            `Você pode desativá-lo em vez de excluir, para que ele pare de aparecer em novos cadastros.`
        );
      } else {
        alert(deleteError.message);
      }
      return;
    }

    setItems((prev) => prev.filter((i) => i.id !== item.id));
    router.refresh();
  }

  const columns: Column<EventCatalogItem>[] = [
    { header: 'Nome', accessor: (i) => <span className="font-medium">{i.label}</span> },
    { header: 'Descrição', accessor: (i) => i.description ?? '—' },
    { header: 'Frequência', accessor: (i) => i.frequency ?? '—' },
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
        <p className="text-sm text-muted-foreground">
          Tipos de evento usados nos lançamentos de despesas e no módulo de Eventos.
        </p>
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4" />
          Novo Item
        </Button>
      </div>

      {editing && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <FieldWrapper label="Nome" error={error ?? undefined}>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Troca de óleo" autoFocus />
              </FieldWrapper>
              <FieldWrapper label="Descrição" error={undefined}>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes opcionais"
                />
              </FieldWrapper>
              <FieldWrapper label="Frequência" error={undefined}>
                <Input
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="Ex: A cada 10.000 km, Mensal, Anual..."
                />
              </FieldWrapper>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        rows={[...items].sort((a, b) => a.sort_order - b.sort_order)}
        keyExtractor={(i) => i.id}
        emptyMessage="Nenhum item cadastrado"
      />
    </div>
  );
}
