'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  vehicleAssignmentSchema,
  type VehicleAssignmentFormValues,
} from '@/lib/validations/financial';
import { FieldWrapper, Select, Textarea } from '@/components/ui/form-fields';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DatePickerBr } from '@/components/ui/date-picker-br';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Vehicle, Driver, VehicleAssignment } from '@/types/database';

interface VehicleAssignmentFormProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  entry?: VehicleAssignment;
}

// CR-004/005 (v1.3): now supports editing an existing assignment (rows in
// the list open this form directly); date fields use the calendar picker.
export function VehicleAssignmentForm({ vehicles, drivers, entry }: VehicleAssignmentFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const tCommon = useTranslations('common');
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [ending, setEnding] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehicleAssignmentFormValues>({
    resolver: zodResolver(vehicleAssignmentSchema),
    defaultValues: entry
      ? {
          vehicle_id: entry.vehicle_id,
          driver_id: entry.driver_id,
          start_date: entry.start_date,
          end_date: entry.end_date ?? '',
          weekly_rental_value: entry.weekly_rental_value,
          notes: entry.notes ?? '',
        }
      : { start_date: new Date().toISOString().slice(0, 10) },
  });

  async function onSubmit(values: VehicleAssignmentFormValues) {
    setServerError(null);

    const payload = {
      ...values,
      end_date: values.end_date || null,
      notes: values.notes || null,
    };

    const { error } = entry
      ? await supabase.from('vehicle_assignments').update(payload).eq('id', entry.id)
      : await supabase.from('vehicle_assignments').insert(payload);

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

  async function handleDelete() {
    if (!entry || !confirm(tCommon('confirmDelete'))) return;
    setDeleting(true);

    const { error } = await supabase.from('vehicle_assignments').delete().eq('id', entry.id);

    if (error) {
      setServerError(error.message);
      setDeleting(false);
      return;
    }

    router.push('/assignments');
    router.refresh();
  }

  async function handleEndNow() {
    if (!entry || !confirm('Encerrar esta alocação hoje? O veículo ficará disponível para nova alocação.')) return;
    setEnding(true);

    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from('vehicle_assignments').update({ end_date: today }).eq('id', entry.id);

    setEnding(false);
    if (error) {
      setServerError(error.message);
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
                    {v.brand} {v.model} - {v.plate_number}
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
            {/* CR-003 (v1.3): renamed from "Valor da Locação Mensal" */}
            <FieldWrapper label="Valor Semanal (R$)" error={errors.weekly_rental_value?.message} required>
              <Controller
                name="weekly_rental_value"
                control={control}
                render={({ field }) => (
                  <CurrencyInput name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
            </FieldWrapper>
            {/* CR-005 (v1.3): calendar picker, DD/MM/AAAA */}
            <FieldWrapper label="Data de Início" error={errors.start_date?.message} required>
              <Controller
                name="start_date"
                control={control}
                render={({ field }) => (
                  <DatePickerBr name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
            </FieldWrapper>
            <FieldWrapper label="Data de Término (opcional)" error={errors.end_date?.message}>
              <Controller
                name="end_date"
                control={control}
                render={({ field }) => (
                  <DatePickerBr name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
            </FieldWrapper>
          </div>

          <FieldWrapper label="Observações" error={errors.notes?.message}>
            <Textarea {...register('notes')} />
          </FieldWrapper>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <div className="flex justify-between gap-2">
            {entry ? (
              <div className="flex gap-2">
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
                  <Trash2 className="h-4 w-4" />
                  {tCommon('delete')}
                </Button>
                {!entry.end_date && (
                  <Button type="button" variant="outline" onClick={handleEndNow} disabled={ending}>
                    Encerrar Alocação
                  </Button>
                )}
              </div>
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
