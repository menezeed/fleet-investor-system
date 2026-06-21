import { z } from 'zod';

export const vehicleSchema = z.object({
  plate_number: z.string().min(1, 'Placa é obrigatória').toUpperCase(),
  brand: z.string().min(1, 'Marca é obrigatória'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  // CR-003 Change 1: "Year" (existing) and "Model Year" (new), shown side by side.
  model_year: z.coerce
    .number()
    .int()
    .min(1980, 'Ano inválido')
    .max(2100, 'Ano inválido'),
  model_year_alt: z.coerce
    .number()
    .int()
    .min(1980, 'Ano do modelo inválido')
    .max(2100, 'Ano do modelo inválido')
    .optional()
    .nullable(),
  color: z.string().optional().nullable(),
  renavam: z.string().optional().nullable(),
  crv_number: z.string().optional().nullable(),
  // CR-003 Change 3
  chassis_number: z.string().optional().nullable(),
  // CR-003 Change 2: date format is a UI concern (DD/MM/YYYY display), the
  // underlying value stored/submitted is still an ISO date string (yyyy-mm-dd).
  acquisition_date: z.string().min(1, 'Data de aquisição é obrigatória'),
  // CR-003 Change 4: single consolidated "Acquisition Value" field.
  acquisition_value: z.coerce.number().min(0, 'Valor deve ser positivo'),
  current_market_value: z.coerce.number().min(0).optional().nullable(),
  acquisition_mileage: z.coerce.number().int().min(0).optional().nullable(),
  current_mileage: z.coerce.number().int().min(0).optional().nullable(),
  status_id: z.string().uuid('Selecione um status'),
  notes: z.string().optional().nullable(),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;
