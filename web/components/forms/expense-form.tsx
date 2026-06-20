'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { expenseSchema, type ExpenseFormValues } from '@/lib/validations/financial';
import { useLookupOptions } from '@/lib/lookups/use-lookup-options';
import { FieldWrapper, Input, Select, Textarea } from '@/components/ui/form-fields';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Vehicle, Expense } from '@/types/database';

interface ExpenseFormProps {
  vehicles: Vehicle[];
  expense?: Expense;
}

export function ExpenseForm({ vehicles, expense }: ExpenseFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const tCommon = useTranslations('common');
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { options: typeOptions } = useLookupOptions('lookup_expense_types', expense?.expense_type_id);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense
      ? {
          vehicle_id: expense.vehicle_id,
          expense_date: expense.expense_date,
          expense_type_id: expense.expense_type_id,
          amount: expense.amount,
          notes: expense.notes ?? '',
        }
      : { expense_date: new Date().toISOString().slice(0, 10) },
  });

  useEffect(() => {
    if (!expense && typeOptions.length > 0) {
      setValue('expense_type_id', typeOptions[0].id);
    }
  }, [expense, typeOptions, setValue]);

  async function onSubmit(values: ExpenseFormValues) {
    setServerError(null);

    const payload = { ...values, notes: values.notes || null };

    const { error } = expense
      ? await supabase.from('expenses').update(payload).eq('id', expense.id)
      : await supabase.from('expenses').insert(payload);

    if (error) {
      setServerError(error.message);
      return;
    }

    router.push('/expenses');
    router.refresh();
  }

  async function handleDelete() {
    if (!expense || !confirm(tCommon('confirmDelete'))) return;
    setDeleting(true);

    const { error } = await supabase.from('expenses').delete().eq('id', expense.id);

    if (error) {
      setServerError(error.message);
      setDeleting(false);
      return;
    }

    router.push('/expenses');
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <FieldWrapper label="Veículo" error={errors.vehicle_id?.message} required>
              <Select {...register('vehicle_id')}>
                <option value="">Selecione...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate_number} — {v.brand} {v.model}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Data" error={errors.expense_date?.message} required>
              <Input type="date" {...register('expense_date')} />
            </FieldWrapper>
            <FieldWrapper label="Tipo de Despesa" error={errors.expense_type_id?.message} required>
              <Select {...register('expense_type_id')}>
                <option value="">Selecione...</option>
                {typeOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Valor (R$)" error={errors.amount?.message} required>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
            </FieldWrapper>
          </div>

          <FieldWrapper label="Observações" error={errors.notes?.message}>
            <Textarea {...register('notes')} />
          </FieldWrapper>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <div className="flex justify-between gap-2">
            {expense ? (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
                <Trash2 className="h-4 w-4" />
                {tCommon('delete')}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {tCommon('save')}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
