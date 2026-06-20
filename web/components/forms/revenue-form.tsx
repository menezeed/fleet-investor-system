'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { revenueSchema, type RevenueFormValues } from '@/lib/validations/financial';
import { useLookupOptions } from '@/lib/lookups/use-lookup-options';
import { FieldWrapper, Input, Select, Textarea } from '@/components/ui/form-fields';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Vehicle, Driver, Revenue } from '@/types/database';

interface RevenueFormProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  revenue?: Revenue;
}

export function RevenueForm({ vehicles, drivers, revenue }: RevenueFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const tCommon = useTranslations('common');
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { options: typeOptions } = useLookupOptions('lookup_revenue_types', revenue?.revenue_type_id);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RevenueFormValues>({
    resolver: zodResolver(revenueSchema),
    defaultValues: revenue
      ? {
          vehicle_id: revenue.vehicle_id,
          driver_id: revenue.driver_id ?? undefined,
          revenue_date: revenue.revenue_date,
          revenue_type_id: revenue.revenue_type_id,
          amount: revenue.amount,
          notes: revenue.notes ?? '',
        }
      : { revenue_date: new Date().toISOString().slice(0, 10) },
  });

  useEffect(() => {
    if (!revenue && typeOptions.length > 0) {
      setValue('revenue_type_id', typeOptions[0].id);
    }
  }, [revenue, typeOptions, setValue]);

  async function onSubmit(values: RevenueFormValues) {
    setServerError(null);

    const payload = {
      ...values,
      driver_id: values.driver_id || null,
      notes: values.notes || null,
    };

    const { error } = revenue
      ? await supabase.from('revenues').update(payload).eq('id', revenue.id)
      : await supabase.from('revenues').insert(payload);

    if (error) {
      setServerError(error.message);
      return;
    }

    router.push('/revenues');
    router.refresh();
  }

  async function handleDelete() {
    if (!revenue || !confirm(tCommon('confirmDelete'))) return;
    setDeleting(true);

    const { error } = await supabase.from('revenues').delete().eq('id', revenue.id);

    if (error) {
      setServerError(error.message);
      setDeleting(false);
      return;
    }

    router.push('/revenues');
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
            <FieldWrapper label="Motorista (opcional)" error={errors.driver_id?.message}>
              <Select {...register('driver_id')}>
                <option value="">—</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Data" error={errors.revenue_date?.message} required>
              <Input type="date" {...register('revenue_date')} />
            </FieldWrapper>
            <FieldWrapper label="Tipo de Receita" error={errors.revenue_type_id?.message} required>
              <Select {...register('revenue_type_id')}>
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
            {revenue ? (
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
