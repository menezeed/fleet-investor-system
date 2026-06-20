import { z } from 'zod';

export const driverSchema = z.object({
  full_name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().optional().nullable(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  tax_id: z.string().optional().nullable(),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  status_id: z.string().uuid('Selecione um status'),
  notes: z.string().optional().nullable(),
});

export type DriverFormValues = z.infer<typeof driverSchema>;
