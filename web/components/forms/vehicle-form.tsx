'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useLookupOptions } from '@/lib/lookups/use-lookup-options';
import { createClient } from '@/lib/supabase/client';
import { vehicleSchema, type VehicleFormValues } from '@/lib/validations/vehicle';
import { FieldWrapper, Input, Select, Textarea } from '@/components/ui/form-fields';
import { CurrencyInput } from '@/components/ui/currency-input';
import { SafeNumberInput } from '@/components/ui/safe-number-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Vehicle } from '@/types/database';

interface VehicleFormProps {
  vehicle?: Vehicle;
}

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const tCommon = useTranslations('common');
  const [serverError, setServerError] = useState<string | null>(null);
  const { options: statusOptions } = useLookupOptions('lookup_vehicle_statuses', vehicle?.status_id);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle
      ? {
          plate_number: vehicle.plate_number,
          brand: vehicle.brand,
          model: vehicle.model,
          model_year: vehicle.model_year,
          color: vehicle.color ?? '',
          renavam: vehicle.renavam ?? '',
          crv_number: vehicle.crv_number ?? '',
          acquisition_date: vehicle.acquisition_date,
          acquisition_cost: vehicle.acquisition_cost,
          acquisition_value: vehicle.acquisition_value ?? undefined,
          current_market_value: vehicle.current_market_value ?? undefined,
          acquisition_mileage: vehicle.acquisition_mileage ?? undefined,
          current_mileage: vehicle.current_mileage ?? undefined,
          status_id: vehicle.status_id,
          notes: vehicle.notes ?? '',
        }
      : undefined,
  });

  // For new vehicles, default to the first available status once options load
  // (mirrors the old hardcoded default of 'available').
  useEffect(() => {
    if (!vehicle && statusOptions.length > 0) {
      setValue('status_id', statusOptions[0].id);
    }
  }, [vehicle, statusOptions, setValue]);

  async function onSubmit(values: VehicleFormValues) {
    setServerError(null);

    const payload = {
      ...values,
      color: values.color || null,
      renavam: values.renavam || null,
      crv_number: values.crv_number || null,
      notes: values.notes || null,
      acquisition_value: values.acquisition_value ?? null,
      current_market_value: values.current_market_value ?? null,
      acquisition_mileage: values.acquisition_mileage ?? null,
      current_mileage: values.current_mileage ?? null,
    };

    const { error } = vehicle
      ? await supabase.from('vehicles').update(payload).eq('id', vehicle.id)
      : await supabase.from('vehicles').insert(payload);

    if (error) {
      setServerError(error.message);
      return;
    }

    router.push('/vehicles');
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <FieldWrapper label="Placa" error={errors.plate_number?.message} required>
              <Input {...register('plate_number')} placeholder="ABC1D23" />
            </FieldWrapper>
            <FieldWrapper label="Marca" error={errors.brand?.message} required>
              <Input {...register('brand')} placeholder="Chevrolet" />
            </FieldWrapper>
            <FieldWrapper label="Modelo" error={errors.model?.message} required>
              <Input {...register('model')} placeholder="Onix" />
            </FieldWrapper>
            <FieldWrapper label="Ano" error={errors.model_year?.message} required>
              <Controller
                name="model_year"
                control={control}
                render={({ field }) => (
                  <SafeNumberInput
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    allowDecimal={false}
                    placeholder="2023"
                  />
                )}
              />
            </FieldWrapper>
            <FieldWrapper label="Cor" error={errors.color?.message}>
              <Input {...register('color')} placeholder="Branco" />
            </FieldWrapper>
            <FieldWrapper label="Status" error={errors.status_id?.message} required>
              <Select {...register('status_id')}>
                <option value="">Selecione...</option>
                {statusOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <FieldWrapper label="RENAVAM" error={errors.renavam?.message}>
              <Input {...register('renavam')} />
            </FieldWrapper>
            <FieldWrapper label="Nº CRV" error={errors.crv_number?.message}>
              <Input {...register('crv_number')} />
            </FieldWrapper>
            <FieldWrapper label="Data de Aquisição" error={errors.acquisition_date?.message} required>
              <Input type="date" {...register('acquisition_date')} />
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <FieldWrapper label="Custo de Aquisição (R$)" error={errors.acquisition_cost?.message} required>
              <Controller
                name="acquisition_cost"
                control={control}
                render={({ field }) => (
                  <CurrencyInput name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
            </FieldWrapper>
            <FieldWrapper label="Valor de Aquisição (R$)" error={errors.acquisition_value?.message}>
              <Controller
                name="acquisition_value"
                control={control}
                render={({ field }) => (
                  <CurrencyInput name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
            </FieldWrapper>
            <FieldWrapper label="Valor de Mercado Atual (R$)" error={errors.current_market_value?.message}>
              <Controller
                name="current_market_value"
                control={control}
                render={({ field }) => (
                  <CurrencyInput name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
            </FieldWrapper>
            <FieldWrapper label="KM na Aquisição" error={errors.acquisition_mileage?.message}>
              <Controller
                name="acquisition_mileage"
                control={control}
                render={({ field }) => (
                  <SafeNumberInput
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    allowDecimal={false}
                  />
                )}
              />
            </FieldWrapper>
            <FieldWrapper label="KM Atual" error={errors.current_mileage?.message}>
              <Controller
                name="current_mileage"
                control={control}
                render={({ field }) => (
                  <SafeNumberInput
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    allowDecimal={false}
                  />
                )}
              />
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
