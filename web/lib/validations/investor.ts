import { z } from 'zod';
import { isValidCpf, isValidCnpj, isValidPhone, isValidCep, isPlausiblePix } from '@/lib/masks/br-format';

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export const investorSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(3, 'Informe o nome completo')
      .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/, 'Use apenas letras')
      .refine((v) => v.trim().includes(' '), 'Informe nome e sobrenome'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('E-mail inválido (ex: nome@dominio.com)')
      .optional()
      .or(z.literal('')),
    phone: z
      .string()
      .optional()
      .nullable()
      .refine((v) => !v || isValidPhone(v), 'Telefone inválido — use (DD) 9XXXX-XXXX'),
    document_type_id: z.string().uuid('Selecione um tipo de documento'),
    // Not persisted — set by the form alongside document_type_id so this
    // schema can apply CPF/CNPJ check-digit validation without needing a
    // database round-trip. See InvestorForm for how it's populated.
    document_type_code: z.string().optional(),
    document_number: z.string().trim().min(1, 'Documento é obrigatório'),
    pix_number: z
      .string()
      .optional()
      .nullable()
      .refine((v) => !v || isPlausiblePix(v), 'Chave PIX não reconhecida (CPF, CNPJ, e-mail, telefone ou chave aleatória)'),
    address_street: z.string().trim().optional().nullable(),
    address_number: z.string().trim().optional().nullable(),
    address_complement: z.string().trim().optional().nullable(),
    address_neighborhood: z.string().trim().optional().nullable(),
    address_city: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine((v) => !v || /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(v), 'Cidade deve conter apenas letras'),
    address_state: z.union([z.enum(BRAZILIAN_STATES), z.literal('')]).optional().nullable(),
    address_zip_code: z
      .string()
      .optional()
      .nullable()
      .refine((v) => !v || isValidCep(v), 'CEP inválido — use o formato 00000-000'),
    address_country: z.string().optional().nullable(),
    registration_date: z
      .string()
      .min(1, 'Data de cadastro é obrigatória')
      .refine((v) => new Date(v) <= new Date(), 'Data de cadastro não pode ser no futuro'),
    notes: z.string().optional().nullable(),
    is_active: z.boolean().default(true),
  })
  .refine(
    (data) => data.document_type_code !== 'cpf' || isValidCpf(data.document_number),
    { message: 'CPF inválido — confira os dígitos verificadores', path: ['document_number'] }
  )
  .refine(
    (data) => data.document_type_code !== 'cnpj' || isValidCnpj(data.document_number),
    { message: 'CNPJ inválido — confira os dígitos verificadores', path: ['document_number'] }
  );

export type InvestorFormValues = z.infer<typeof investorSchema>;
