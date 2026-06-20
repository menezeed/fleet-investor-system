'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { driverSchema, type DriverFormValues } from '@/lib/validations/driver';
import { useLookupOptions } from '@/lib/lookups/use-lookup-options';
import { FieldWrapper, Input, Select, Textarea } from '@/components/ui/form-fields';
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
  const { options: statusOptions } = useLookupOptions('lookup_driver_statuses', driver?.status_id);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: driver
      ? {
          full_name: driver.full_name,
          phone: driver.phone ?? '',
          email: driver.email ?? '',
          tax_id: driver.tax_id ?? '',
          start_date: driver.start_date,
          status_id: driver.status_id,
          notes: driver.notes ?? '',
        }
      : undefined,
  });

  useEffect(() => {
    if (!driver && statusOptions.length > 0) {
      setValue('status_id', statusOptions[0].id);
    }
  }, [driver, statusOptions, setValue]);

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
              <Select {...register('status_id')}>
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
            <FieldWrapper label="Data de Início" error={errors.start_date?.message} required>
              <Input type="date" {...register('start_date')} />
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
