'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { investorSchema, type InvestorFormValues, BRAZILIAN_STATES } from '@/lib/validations/investor';
import { useLookupOptions } from '@/lib/lookups/use-lookup-options';
import { maskCpf, maskCnpj, maskPhone, maskCep } from '@/lib/masks/br-format';
import { FieldWrapper, Input, Select, Textarea } from '@/components/ui/form-fields';
import { MaskedInput } from '@/components/ui/masked-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Investor } from '@/types/database';

interface InvestorFormProps {
  investor?: Investor;
}

export function InvestorForm({ investor }: InvestorFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const tCommon = useTranslations('common');
  const [serverError, setServerError] = useState<string | null>(null);
  const { options: documentTypeOptions } = useLookupOptions('lookup_document_types', investor?.document_type_id);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvestorFormValues>({
    resolver: zodResolver(investorSchema),
    defaultValues: investor
      ? {
          full_name: investor.full_name,
          email: investor.email ?? '',
          phone: investor.phone ?? '',
          document_type_id: investor.document_type_id,
          document_number: investor.document_number,
          pix_number: investor.pix_number ?? '',
          address_street: investor.address_street ?? '',
          address_number: investor.address_number ?? '',
          address_complement: investor.address_complement ?? '',
          address_neighborhood: investor.address_neighborhood ?? '',
          address_city: investor.address_city ?? '',
          address_state: (investor.address_state as InvestorFormValues['address_state']) ?? '',
          address_zip_code: investor.address_zip_code ?? '',
          address_country: investor.address_country ?? 'BR',
          registration_date: investor.registration_date,
          notes: investor.notes ?? '',
          is_active: investor.is_active,
        }
      : {
          is_active: true,
          address_country: 'BR',
          registration_date: new Date().toISOString().slice(0, 10),
        },
  });

  const documentTypeId = useWatch({ control, name: 'document_type_id' });
  const documentTypeCode = documentTypeOptions.find((o) => o.id === documentTypeId)?.code;

  // Keep the auxiliary (non-persisted) code field in sync so the schema's
  // CPF/CNPJ check-digit refinement knows which validator to apply.
  useEffect(() => {
    setValue('document_type_code', documentTypeCode);
  }, [documentTypeCode, setValue]);

  // Default to the first document type (CPF, by seed order) for new investors.
  useEffect(() => {
    if (!investor && documentTypeOptions.length > 0 && !documentTypeId) {
      setValue('document_type_id', documentTypeOptions[0].id);
    }
  }, [investor, documentTypeOptions, documentTypeId, setValue]);

  async function onSubmit(values: InvestorFormValues) {
    setServerError(null);

    const { document_type_code, ...rest } = values;
    const payload = {
      ...rest,
      email: values.email || null,
      phone: values.phone || null,
      pix_number: values.pix_number || null,
      address_street: values.address_street || null,
      address_number: values.address_number || null,
      address_complement: values.address_complement || null,
      address_neighborhood: values.address_neighborhood || null,
      address_city: values.address_city || null,
      address_state: values.address_state || null,
      address_zip_code: values.address_zip_code || null,
      notes: values.notes || null,
    };

    const { error } = investor
      ? await supabase.from('investors').update(payload).eq('id', investor.id)
      : await supabase.from('investors').insert(payload);

    if (error) {
      setServerError(
        error.message.includes('idx_investors_document_number')
          ? 'Já existe um investidor cadastrado com este documento.'
          : error.message
      );
      return;
    }

    router.push('/investors');
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <FieldWrapper label="Nome Completo" error={errors.full_name?.message} required className="col-span-2">
              <Input {...register('full_name')} placeholder="Nome e sobrenome" />
            </FieldWrapper>
            <FieldWrapper label="Data de Cadastro" error={errors.registration_date?.message} required>
              <Input type="date" max={new Date().toISOString().slice(0, 10)} {...register('registration_date')} />
            </FieldWrapper>
            <FieldWrapper label="E-mail" error={errors.email?.message}>
              <Input type="email" {...register('email')} placeholder="nome@dominio.com" />
            </FieldWrapper>
            <FieldWrapper label="Telefone" error={errors.phone?.message}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <MaskedInput
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    mask={maskPhone}
                    placeholder="(11) 91234-5678"
                  />
                )}
              />
            </FieldWrapper>
            <FieldWrapper label="Tipo de Documento" error={errors.document_type_id?.message} required>
              <Select {...register('document_type_id')}>
                <option value="">Selecione...</option>
                {documentTypeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Número do Documento" error={errors.document_number?.message} required>
              {documentTypeCode === 'cpf' || documentTypeCode === 'cnpj' ? (
                <Controller
                  name="document_number"
                  control={control}
                  render={({ field }) => (
                    <MaskedInput
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      mask={documentTypeCode === 'cpf' ? maskCpf : maskCnpj}
                      placeholder={documentTypeCode === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                    />
                  )}
                />
              ) : (
                <Input {...register('document_number')} placeholder="Número do documento" />
              )}
            </FieldWrapper>
            <FieldWrapper label="Chave PIX" error={errors.pix_number?.message}>
              <Input {...register('pix_number')} placeholder="CPF, e-mail, telefone ou chave aleatória" />
            </FieldWrapper>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Endereço</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <FieldWrapper label="Rua" error={errors.address_street?.message} className="col-span-2">
                <Input {...register('address_street')} />
              </FieldWrapper>
              <FieldWrapper label="Número" error={errors.address_number?.message}>
                <Input {...register('address_number')} placeholder="123, 123A ou S/N" />
              </FieldWrapper>
              <FieldWrapper label="Complemento" error={errors.address_complement?.message}>
                <Input {...register('address_complement')} placeholder="Apto, bloco..." />
              </FieldWrapper>
              <FieldWrapper label="Bairro" error={errors.address_neighborhood?.message}>
                <Input {...register('address_neighborhood')} />
              </FieldWrapper>
              <FieldWrapper label="Cidade" error={errors.address_city?.message}>
                <Input {...register('address_city')} />
              </FieldWrapper>
              <FieldWrapper label="Estado" error={errors.address_state?.message}>
                <Select {...register('address_state')}>
                  <option value="">Selecione...</option>
                  {BRAZILIAN_STATES.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </Select>
              </FieldWrapper>
              <FieldWrapper label="CEP" error={errors.address_zip_code?.message}>
                <Controller
                  name="address_zip_code"
                  control={control}
                  render={({ field }) => (
                    <MaskedInput
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      mask={maskCep}
                      placeholder="00000-000"
                    />
                  )}
                />
              </FieldWrapper>
            </div>
          </div>

          <FieldWrapper label="Observações" error={errors.notes?.message}>
            <Textarea {...register('notes')} />
          </FieldWrapper>

          <div className="flex items-center gap-2">
            <input id="is_active" type="checkbox" {...register('is_active')} className="h-4 w-4" />
            <label htmlFor="is_active" className="text-sm">
              Investidor ativo
            </label>
          </div>

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
