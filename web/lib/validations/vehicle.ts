import { z } from 'zod';

export const vehicleSchema = z.object({
  plate_number: z.string().min(1, 'Placa é obrigatória').toUpperCase(),
  brand: z.string().min(1, 'Marca é obrigatória'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  model_year: z.coerce
    .number()
    .int()
    .min(1980, 'Ano inválido')
    .max(2100, 'Ano inválido'),
  color: z.string().optional().nullable(),
  renavam: z.string().optional().nullable(),
  crv_number: z.string().optional().nullable(),
  acquisition_date: z.string().min(1, 'Data de aquisição é obrigatória'),
  acquisition_cost: z.coerce.number().min(0, 'Custo deve ser positivo'),
  acquisition_value: z.coerce.number().min(0).optional().nullable(),
  current_market_value: z.coerce.number().min(0).optional().nullable(),
  acquisition_mileage: z.coerce.number().int().min(0).optional().nullable(),
  current_mileage: z.coerce.number().int().min(0).optional().nullable(),
  status_id: z.string().uuid('Selecione um status'),
  notes: z.string().optional().nullable(),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;
