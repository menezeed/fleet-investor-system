'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { driverSchema, type DriverFormValues } from '@/lib/validations/driver';
import { useLookupOptions } from '@/lib/lookups/use-lookup-options';
import { FieldWrapper, Input, Select, Textarea } from '@/components/ui/form-fields';
import { DatePickerBr } from '@/components/ui/date-picker-br';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Driver } from '@/types/database';

interface DriverFormProps {
  driver?: Driver;
}

export function DriverForm({ driver }: DriverFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const tCommon = useTranslations('common');
  const [serverError, setServerError] = useState<string | null>(null);
  const { options: statusOptions, loading: statusLoading } = useLookupOptions(
    'lookup_driver_statuses',
    driver?.status_id
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
  });

  // CR-008 bug fix: populate the form via reset() only once the lookup
  // options have actually loaded. Using defaultValues directly races against
  // the async fetch — the <select> mounts with a value before its <option>s
  // exist, so the browser can't select anything and it silently falls back
  // to blank/"Select", even though the value was set correctly in the form
  // state. reset() re-syncs the rendered <select> after options are present.
  useEffect(() => {
    if (statusLoading) return;

    if (driver) {
      reset({
        full_name: driver.full_name,
        phone: driver.phone ?? '',
        email: driver.email ?? '',
        tax_id: driver.tax_id ?? '',
        start_date: driver.start_date,
        status_id: driver.status_id,
        notes: driver.notes ?? '',
      });
    } else if (statusOptions.length > 0) {
      reset({ status_id: statusOptions[0].id });
    }
  }, [driver, statusLoading, statusOptions, reset]);

  async function onSubmit(values: DriverFormValues) {
    setServerError(null);

    const payload = {
      ...values,
      email: values.email || null,
      phone: values.phone || null,
      tax_id: values.tax_id || null,
      notes: values.notes || null,
    };

    const { error } = driver
      ? await supabase.from('drivers').update(payload).eq('id', driver.id)
      : await supabase.from('drivers').insert(payload);

    if (error) {
      setServerError(error.message);
      return;
    }

    router.push('/drivers');
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <FieldWrapper label="Nome Completo" error={errors.full_name?.message} required className="col-span-2">
              <Input {...register('full_name')} />
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
            <FieldWrapper label="Telefone" error={errors.phone?.message}>
              <Input {...register('phone')} />
            </FieldWrapper>
            <FieldWrapper label="E-mail" error={errors.email?.message}>
              <Input type="email" {...register('email')} />
            </FieldWrapper>
            <FieldWrapper label="CPF / Tax ID" error={errors.tax_id?.message}>
              <Input {...register('tax_id')} />
            </FieldWrapper>
            {/* CR-008: calendar picker, DD/MM/AAAA */}
            <FieldWrapper label="Data de Início" error={errors.start_date?.message} required>
              <Controller
                name="start_date"
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
