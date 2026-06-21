import { z } from 'zod';

// CR-005: Event Catalog fields = Name, Description, Frequency (free text,
// no validation in this version per the CR).
export const eventCatalogItemSchema = z.object({
  label: z.string().trim().min(1, 'Nome é obrigatório'),
  description: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
});

export type EventCatalogItemFormValues = z.infer<typeof eventCatalogItemSchema>;
