'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cashFlowSchema, type CashFlowFormValues } from '@/lib/validations/financial';
import { useLookupOptions } from '@/lib/lookups/use-lookup-options';
import { FieldWrapper, Select, Textarea } from '@/components/ui/form-fields';
import { CurrencyInput } from '@/components/ui/currency-input';
import { SafeNumberInput } from '@/components/ui/safe-number-input';
import { DatePickerBr } from '@/components/ui/date-picker-br';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Vehicle, CashFlow } from '@/types/database';

interface CashFlowFormProps {
  vehicles: Vehicle[];
  entry?: CashFlow;
}

// CR-011: Cash Flow Entry Screen. Vehicle (same behavior as old Revenue),
// Date (calendar picker), Transaction Type (Revenue/Expense), Transaction
// Category (dynamic per type), Amount, Current Mileage (optional), Notes
// (optional, free text).
export function CashFlowForm({ vehicles, entry }: CashFlowFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const tCommon = useTranslations('common');
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CashFlowFormValues>({
    resolver: zodResolver(cashFlowSchema),
  });

  const transactionType = useWatch({ control, name: 'transaction_type' });
  const selectedVehicleId = useWatch({ control, name: 'vehicle_id' });

  // CR-011: Transaction Category populated dynamically according to the
  // selected Transaction Type — revenue categories vs expense categories
  // are two different lookup tables.
  const revenueLookup = useLookupOptions(
    'lookup_revenue_types',
    entry?.transaction_type === 'revenue' ? entry.category_id : undefined
  );
  const expenseLookup = useLookupOptions(
    'lookup_expense_types',
    entry?.transaction_type === 'expense' ? entry.category_id : undefined
  );
  const categoryOptions = transactionType === 'expense' ? expenseLookup.options : revenueLookup.options;
  const categoryLoading = transactionType === 'expense' ? expenseLookup.loading : revenueLookup.loading;

  // Race-condition fix (same as other forms): populate the form via reset()
  // only once the relevant lookup has loaded, for the initial load from an
  // existing entry. `initialized` tracks whether that first sync has
  // already happened, so this effect doesn't keep re-running and fighting
  // the user's own type changes afterwards.
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    if (entry) {
      const lookup = entry.transaction_type === 'expense' ? expenseLookup : revenueLookup;
      if (lookup.loading) return;
      reset({
        vehicle_id: entry.vehicle_id,
        transaction_date: entry.transaction_date,
        transaction_type: entry.transaction_type,
        category_id: entry.category_id,
        amount: entry.amount,
        mileage: entry.mileage ?? undefined,
        notes: entry.notes ?? '',
      });
      setInitialized(true);
    } else if (!categoryLoading && categoryOptions.length > 0) {
      reset({
        transaction_type: 'revenue',
        transaction_date: new Date().toISOString().slice(0, 10),
        category_id: categoryOptions[0].id,
      });
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, categoryLoading, categoryOptions, initialized]);

  // After the initial sync, if the user manually changes Transaction Type,
  // swap the category to the first option of the newly-selected type.
  useEffect(() => {
    if (!initialized) return;
    if (!categoryLoading && categoryOptions.length > 0) {
      setValue('category_id', categoryOptions[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionType]);

  // CR-009 (v1.3): when Transaction Category = "Receita de Locação" (rental
  // revenue), pre-fill Amount from the vehicle's active assignment's Weekly
  // Rental Value (Alocações screen) — not the vehicle's own rental_value
  // field. The user can still edit the value manually afterwards.
  const categoryId = useWatch({ control, name: 'category_id' });
  const selectedCategoryLabel = categoryOptions.find((c) => c.id === categoryId)?.label;

  useEffect(() => {
    if (entry) return;
    if (transactionType !== 'revenue') return;
    if (!selectedVehicleId) return;
    if (selectedCategoryLabel !== 'Receita de Locação') return;

    let active = true;
    supabase
      .from('vehicle_assignments')
      .select('weekly_rental_value')
      .eq('vehicle_id', selectedVehicleId)
      .is('end_date', null)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.weekly_rental_value != null) {
          setValue('amount', data.weekly_rental_value);
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicleId, transactionType, selectedCategoryLabel]);

  async function onSubmit(values: CashFlowFormValues) {
    setServerError(null);
    setSuccessMessage(null);

    const payload = {
      ...values,
      mileage: values.mileage ?? null,
      notes: values.notes || null,
    };

    const { error } = entry
      ? await supabase.from('cash_flow').update(payload).eq('id', entry.id)
      : await supabase.from('cash_flow').insert(payload);

    if (error) {
      setServerError(error.message);
      return;
    }

    // CR-007 (v1.3): stay on this screen after saving instead of returning
    // to the list, so the user can immediately register another entry. The
    // edit screen still redirects back, since there's nothing further to do
    // after updating a specific record.
    if (entry) {
      router.push('/cash-flow');
      router.refresh();
    } else {
      reset({
        vehicle_id: values.vehicle_id, // keep the vehicle selected for fast repeat entries
        transaction_type: 'revenue',
        transaction_date: values.transaction_date, // keep the date too — common case is several entries on the same day
        category_id: categoryOptions[0]?.id,
      });
      setSuccessMessage('Lançamento salvo com sucesso. Você pode cadastrar outro.');
    }
  }

  async function handleDelete() {
    if (!entry || !confirm(tCommon('confirmDelete'))) return;
    setDeleting(true);

    const { error } = await supabase.from('cash_flow').delete().eq('id', entry.id);

    if (error) {
      setServerError(error.message);
      setDeleting(false);
      return;
    }

    router.push('/cash-flow');
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
            <FieldWrapper label="Data" error={errors.transaction_date?.message} required>
              <Controller
                name="transaction_date"
                control={control}
                render={({ field }) => (
                  <DatePickerBr name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
            </FieldWrapper>
            <FieldWrapper label="Tipo de Transação" error={errors.transaction_type?.message} required>
              <Select {...register('transaction_type')}>
                <option value="revenue">Receita</option>
                <option value="expense">Despesa</option>
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Categoria" error={errors.category_id?.message} required>
              <Select {...register('category_id')} disabled={categoryLoading}>
                <option value="">Selecione...</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Valor (R$)" error={errors.amount?.message} required>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputClassName={transactionType === 'expense' ? 'text-destructive font-medium' : undefined}
                  />
                )}
              />
            </FieldWrapper>
            <FieldWrapper label="Quilometragem Atual" error={errors.mileage?.message}>
              <Controller
                name="mileage"
                control={control}
                render={({ field }) => (
                  <SafeNumberInput
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    allowDecimal={false}
                    thousandsSeparator
                  />
                )}
              />
            </FieldWrapper>
          </div>

          <FieldWrapper label="Observações" error={errors.notes?.message}>
            <Textarea {...register('notes')} placeholder="Detalhes adicionais (opcional)" />
          </FieldWrapper>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          {successMessage && <p className="text-sm text-success">{successMessage}</p>}

          <div className="flex justify-between gap-2">
            {entry ? (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
                <Trash2 className="h-4 w-4" />
                {tCommon('delete')}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/cash-flow')}>
                Voltar
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
