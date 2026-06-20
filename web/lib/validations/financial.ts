import { z } from 'zod';

export const revenueSchema = z.object({
  vehicle_id: z.string().uuid('Selecione um veículo'),
  driver_id: z.string().uuid().optional().nullable(),
  revenue_date: z.string().min(1, 'Data é obrigatória'),
  revenue_type_id: z.string().uuid('Selecione um tipo de receita'),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  notes: z.string().optional().nullable(),
});

export const expenseSchema = z.object({
  vehicle_id: z.string().uuid('Selecione um veículo'),
  expense_date: z.string().min(1, 'Data é obrigatória'),
  expense_type_id: z.string().uuid('Selecione um tipo de despesa'),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  notes: z.string().optional().nullable(),
});

export const vehicleEventSchema = z.object({
  vehicle_id: z.string().uuid('Selecione um veículo'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  planned_date: z.string().optional().nullable(),
  value: z.coerce.number().optional().nullable(),
  is_completed: z.boolean().default(false),
});

export const vehicleAssignmentSchema = z
  .object({
    vehicle_id: z.string().uuid('Selecione um veículo'),
    driver_id: z.string().uuid('Selecione um motorista'),
    start_date: z.string().min(1, 'Data de início é obrigatória'),
    end_date: z.string().optional().nullable(),
    monthly_rental_value: z.coerce.number().min(0, 'Valor deve ser positivo'),
    notes: z.string().optional().nullable(),
  })
  .refine((data) => !data.end_date || data.end_date >= data.start_date, {
    message: 'Data final deve ser posterior à data inicial',
    path: ['end_date'],
  });

export const investorParticipationSchema = z.object({
  investor_id: z.string().uuid('Selecione um investidor'),
  vehicle_id: z.string().uuid('Selecione um veículo'),
  ownership_percentage: z.coerce.number().positive('Deve ser maior que zero').max(100, 'Máximo 100%'),
  administration_fee_percentage: z.coerce.number().min(0).max(100).default(0),
  effective_date: z.string().min(1),
});

export type RevenueFormValues = z.infer<typeof revenueSchema>;
export type ExpenseFormValues = z.infer<typeof expenseSchema>;
export type VehicleEventFormValues = z.infer<typeof vehicleEventSchema>;
export type VehicleAssignmentFormValues = z.infer<typeof vehicleAssignmentSchema>;
export type InvestorParticipationFormValues = z.infer<typeof investorParticipationSchema>;
