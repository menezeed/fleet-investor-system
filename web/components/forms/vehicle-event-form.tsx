'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { vehicleEventSchema, type VehicleEventFormValues } from '@/lib/validations/financial';
import { useLookupOptions } from '@/lib/lookups/use-lookup-options';
import { FieldWrapper, Input, Select, Textarea } from '@/components/ui/form-fields';
import { CurrencyInput } from '@/components/ui/currency-input';
import { SafeNumberInput } from '@/components/ui/safe-number-input';
import { DateInputBr } from '@/components/ui/date-input-br';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Vehicle, VehicleEvent } from '@/types/database';

interface VehicleEventFormProps {
  vehicles: Vehicle[];
  event?: VehicleEvent;
}

// CR-004 Change 4: Event Date, Event Type (catalog), Value (optional),
// Mileage (optional).
export function VehicleEventForm({ vehicles, event }: VehicleEventFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const tCommon = useTranslations('common');
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { options: catalogOptions } = useLookupOptions('lookup_expense_types', event?.catalog_item_id);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VehicleEventFormValues>({
    resolver: zodResolver(vehicleEventSchema),
    defaultValues: event
      ? {
          vehicle_id: event.vehicle_id,
          catalog_item_id: event.catalog_item_id ?? undefined,
          description: event.description ?? '',
          planned_date: event.planned_date ?? '',
          value: event.value ?? undefined,
          mileage: event.mileage ?? undefined,
          is_completed: event.is_completed,
        }
      : { is_completed: false, planned_date: new Date().toISOString().slice(0, 10) },
  });

  useEffect(() => {
    if (!event && catalogOptions.length > 0) {
      setValue('catalog_item_id', catalogOptions[0].id);
    }
  }, [event, catalogOptions, setValue]);

  async function onSubmit(values: VehicleEventFormValues) {
    setServerError(null);

    const payload = {
      ...values,
      description: values.description || null,
      value: values.value ?? null,
      mileage: values.mileage ?? null,
    };

    const { error } = event
      ? await supabase.from('vehicle_events').update(payload).eq('id', event.id)
      : await supabase.from('vehicle_events').insert(payload);

    if (error) {
      setServerError(error.message);
      return;
    }

    router.push('/events');
    router.refresh();
  }

  async function handleDelete() {
    if (!event || !confirm(tCommon('confirmDelete'))) return;
    setDeleting(true);

    const { error } = await supabase.from('vehicle_events').delete().eq('id', event.id);

    if (error) {
      setServerError(error.message);
      setDeleting(false);
      return;
    }

    router.push('/events');
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
            <FieldWrapper label="Tipo de Evento" error={errors.catalog_item_id?.message} required>
              <Select {...register('catalog_item_id')}>
                <option value="">Selecione...</option>
                {catalogOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Data do Evento" error={errors.planned_date?.message} required>
              <Controller
                name="planned_date"
                control={control}
                render={({ field }) => (
                  <DateInputBr name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
            </FieldWrapper>
            <FieldWrapper label="Valor (R$)" error={errors.value?.message}>
              <Controller
                name="value"
                control={control}
                render={({ field }) => (
                  <CurrencyInput name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
            </FieldWrapper>
            <FieldWrapper label="Quilometragem" error={errors.mileage?.message}>
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

          <FieldWrapper label="Observações" error={errors.description?.message}>
            <Textarea {...register('description')} placeholder="Detalhes adicionais (opcional)" />
          </FieldWrapper>

          <div className="flex items-center gap-2">
            <input id="is_completed" type="checkbox" {...register('is_completed')} className="h-4 w-4" />
            <label htmlFor="is_completed" className="text-sm">
              Evento concluído
            </label>
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <div className="flex justify-between gap-2">
            {event ? (
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
