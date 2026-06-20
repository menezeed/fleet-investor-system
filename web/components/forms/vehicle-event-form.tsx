'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { vehicleEventSchema, type VehicleEventFormValues } from '@/lib/validations/financial';
import { FieldWrapper, Input, Select, Textarea } from '@/components/ui/form-fields';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Vehicle, VehicleEvent } from '@/types/database';

interface VehicleEventFormProps {
  vehicles: Vehicle[];
  event?: VehicleEvent;
}

export function VehicleEventForm({ vehicles, event }: VehicleEventFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const tCommon = useTranslations('common');
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehicleEventFormValues>({
    resolver: zodResolver(vehicleEventSchema),
    defaultValues: event
      ? {
          vehicle_id: event.vehicle_id,
          description: event.description,
          planned_date: event.planned_date ?? '',
          value: event.value ?? undefined,
          is_completed: event.is_completed,
        }
      : { is_completed: false },
  });

  async function onSubmit(values: VehicleEventFormValues) {
    setServerError(null);

    const payload = {
      ...values,
      planned_date: values.planned_date || null,
      value: values.value ?? null,
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
            <FieldWrapper label="Data Planejada" error={errors.planned_date?.message}>
              <Input type="date" {...register('planned_date')} />
            </FieldWrapper>
            <FieldWrapper label="Valor Estimado (R$)" error={errors.value?.message}>
              <Controller
                name="value"
                control={control}
                render={({ field }) => (
                  <CurrencyInput name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
            </FieldWrapper>
          </div>

          <FieldWrapper label="Descrição" error={errors.description?.message} required>
            <Textarea {...register('description')} placeholder="Ex: Troca de óleo, revisão dos 20.000km..." />
          </FieldWrapper>

          {event && (
            <div className="flex items-center gap-2">
              <input id="is_completed" type="checkbox" {...register('is_completed')} className="h-4 w-4" />
              <label htmlFor="is_completed" className="text-sm">
                Evento concluído
              </label>
            </div>
          )}

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
