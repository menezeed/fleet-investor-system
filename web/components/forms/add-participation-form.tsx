'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { FieldWrapper, Select } from '@/components/ui/form-fields';
import { SafeNumberInput } from '@/components/ui/safe-number-input';
import { Button } from '@/components/ui/button';
import type { Investor } from '@/types/database';

const schema = z.object({
  investor_id: z.string().uuid('Selecione um investidor'),
  ownership_percentage: z.coerce.number().positive('Deve ser maior que zero').max(100, 'Máximo 100%'),
  administration_fee_percentage: z.coerce.number().min(0).max(100).default(0),
});

type FormValues = z.infer<typeof schema>;

interface AddParticipationFormProps {
  vehicleId: string;
  investors: Investor[];
}

export function AddParticipationForm({ vehicleId, investors }: AddParticipationFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { administration_fee_percentage: 0 },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);

    const { error } = await supabase.from('investor_participations').insert({
      vehicle_id: vehicleId,
      investor_id: values.investor_id,
      ownership_percentage: values.ownership_percentage,
      administration_fee_percentage: values.administration_fee_percentage,
    });

    if (error) {
      // The DB trigger raises a clear exception when ownership would exceed 100%
      setServerError(error.message);
      return;
    }

    reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-3">
      <FieldWrapper label="Investidor" error={errors.investor_id?.message} className="min-w-[200px]">
        <Select {...register('investor_id')}>
          <option value="">Selecione...</option>
          {investors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.full_name}
            </option>
          ))}
        </Select>
      </FieldWrapper>
      <FieldWrapper label="Propriedade (%)" error={errors.ownership_percentage?.message} className="w-32">
        <Controller
          name="ownership_percentage"
          control={control}
          render={({ field }) => (
            <SafeNumberInput
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="0,00"
            />
          )}
        />
      </FieldWrapper>
      <FieldWrapper label="Taxa Adm. (%)" error={errors.administration_fee_percentage?.message} className="w-32">
        <Controller
          name="administration_fee_percentage"
          control={control}
          render={({ field }) => (
            <SafeNumberInput
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="0,00"
            />
          )}
        />
      </FieldWrapper>
      <Button type="submit" disabled={isSubmitting}>
        Adicionar
      </Button>
      {serverError && <p className="w-full text-sm text-destructive">{serverError}</p>}
    </form>
  );
}
