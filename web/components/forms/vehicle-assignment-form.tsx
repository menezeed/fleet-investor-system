'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import {
  vehicleAssignmentSchema,
  type VehicleAssignmentFormValues,
} from '@/lib/validations/financial';
import { FieldWrapper, Input, Select, Textarea } from '@/components/ui/form-fields';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Vehicle, Driver } from '@/types/database';

interface VehicleAssignmentFormProps {
  vehicles: Vehicle[];
  drivers: Driver[];
}

export function VehicleAssignmentForm({ vehicles, drivers }: VehicleAssignmentFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const tCommon = useTranslations('common');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehicleAssignmentFormValues>({
    resolver: zodResolver(vehicleAssignmentSchema),
    defaultValues: { start_date: new Date().toISOString().slice(0, 10) },
  });

  async function onSubmit(values: VehicleAssignmentFormValues) {
    setServerError(null);

    const payload = {
      ...values,
      end_date: values.end_date || null,
      notes: values.notes || null,
    };

    const { error } = await supabase.from('vehicle_assignments').insert(payload);

    if (error) {
      // DB enforces: one active assignment per vehicle, and start_date >= acquisition_date
      setServerError(
        error.message.includes('idx_one_active_assignment_per_vehicle')
          ? 'Este veículo já possui uma alocação ativa. Encerre a atual antes de criar uma nova.'
          : error.message
      );
      return;
    }

    router.push('/assignments');
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
            <FieldWrapper label="Motorista" error={errors.driver_id?.message} required>
              <Select {...register('driver_id')}>
                <option value="">Selecione...</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Valor da Locação Mensal (R$)" error={errors.monthly_rental_value?.message} required>
              <Controller
                name="monthly_rental_value"
                control={control}
                render={({ field }) => (
                  <CurrencyInput name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
            </FieldWrapper>
            <FieldWrapper label="Data de Início" error={errors.start_date?.message} required>
              <Input type="date" {...register('start_date')} />
            </FieldWrapper>
            <FieldWrapper label="Data de Término (opcional)" error={errors.end_date?.message}>
              <Input type="date" {...register('end_date')} />
            </FieldWrapper>
          </div>

          <FieldWrapper label="Observações" error={errors.notes?.message}>
            <Textarea {...register('notes')} />
          </FieldWrapper>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {tCommon('save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
