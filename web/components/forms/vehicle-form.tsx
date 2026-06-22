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
import { DatePickerBr } from '@/components/ui/date-picker-br';
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
  // CR-003 Change 6 fix: passing vehicle?.status_id ensures the current
  // status is included even if it was later deactivated, so the edit screen
  // never falls back to a blank "Select" — it always shows the saved value.
  const { options: statusOptions, loading: statusLoading } = useLookupOptions('lookup_vehicle_statuses', vehicle?.status_id);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
  });

  // CR-003 Change 6 bug fix (recurring in UAT/CR-008 for drivers too):
  // populate the form via reset() only once the lookup options have loaded.
  // Setting defaultValues directly races against the async options fetch —
  // the <select> mounts with a status_id value before its <option>s exist,
  // so the browser silently shows blank/"Select" even though the underlying
  // form state is correct. reset() re-syncs the rendered <select> once
  // options are actually present.
  useEffect(() => {
    if (statusLoading) return;

    if (vehicle) {
      reset({
        plate_number: vehicle.plate_number,
        brand: vehicle.brand,
        model: vehicle.model,
        model_year: vehicle.model_year,
        model_year_alt: vehicle.model_year_alt ?? undefined,
        color: vehicle.color ?? '',
        renavam: vehicle.renavam ?? '',
        crv_number: vehicle.crv_number ?? '',
        chassis_number: vehicle.chassis_number ?? '',
        acquisition_date: vehicle.acquisition_date,
        acquisition_value: vehicle.acquisition_value,
        current_market_value: vehicle.current_market_value ?? undefined,
        acquisition_mileage: vehicle.acquisition_mileage ?? undefined,
        current_mileage: vehicle.current_mileage ?? undefined,
        rental_value: vehicle.rental_value ?? undefined,
        status_id: vehicle.status_id,
        notes: vehicle.notes ?? '',
      });
    } else if (statusOptions.length > 0) {
      reset({ status_id: statusOptions[0].id });
    }
  }, [vehicle, statusLoading, statusOptions, reset]);

  async function onSubmit(values: VehicleFormValues) {
    setServerError(null);

    const payload = {
      ...values,
      color: values.color || null,
      renavam: values.renavam || null,
      crv_number: values.crv_number || null,
      chassis_number: values.chassis_number || null,
      notes: values.notes || null,
      model_year_alt: values.model_year_alt ?? null,
      current_market_value: values.current_market_value ?? null,
      acquisition_mileage: values.acquisition_mileage ?? null,
      current_mileage: values.current_mileage ?? null,
      rental_value: values.rental_value ?? null,
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
            {/* CR-003 Change 1: "Year" and "Model Year" shown side by side */}
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
                    placeholder="2020"
                  />
                )}
              />
            </FieldWrapper>
            <FieldWrapper label="Ano Modelo" error={errors.model_year_alt?.message}>
              <Controller
                name="model_year_alt"
                control={control}
                render={({ field }) => (
                  <SafeNumberInput
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    allowDecimal={false}
                    placeholder="2021"
                  />
                )}
              />
            </FieldWrapper>
            <FieldWrapper label="Cor" error={errors.color?.message}>
              <Input {...register('color')} placeholder="Branco" />
            </FieldWrapper>
            <FieldWrapper label="Status" error={errors.status_id?.message} required>
              <Select {...register('status_id')} disabled={statusLoading}>
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
            {/* CR-003 Change 3 */}
            <FieldWrapper label="Número do Chassi" error={errors.chassis_number?.message}>
              <Input {...register('chassis_number')} />
            </FieldWrapper>
            {/* CR-003 Change 2: DD/MM/YYYY display */}
            <FieldWrapper label="Data de Aquisição" error={errors.acquisition_date?.message} required>
              <Controller
                name="acquisition_date"
                control={control}
                render={({ field }) => (
                  <DatePickerBr
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                )}
              />
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {/* CR-003 Change 4: single consolidated "Acquisition Value" field */}
            <FieldWrapper label="Valor de Aquisição (R$)" error={errors.acquisition_value?.message} required>
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
            {/* CR-003 Change 5: thousands separator on mileage fields */}
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
                    thousandsSeparator
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
                    thousandsSeparator
                  />
                )}
              />
            </FieldWrapper>
          </div>

          {/* CR-007: default rental amount, used to pre-fill Cash Flow revenue entries */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <FieldWrapper label="Valor da Locação (R$)" error={errors.rental_value?.message}>
              <Controller
                name="rental_value"
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
