// Mirrors supabase/migrations schema. Keep in sync when migrations change.

// Stable codes used by frontend logic (badge colors, conditional UI).
// These match lookup_*.code values seeded in migration 0005, but the actual
// list of options is data-driven — these unions are only a hint for known
// "system" codes that the UI treats specially (e.g. 'maintenance' status
// driving a warning badge). New custom options created by the admin will
// fall through to the default case wherever these are used.
export type VehicleStatusCode = 'available' | 'rented' | 'maintenance' | 'sold' | string;
export type DriverStatusCode = 'active' | 'inactive' | 'suspended' | string;
export type RevenueTypeCode = 'rental_payment' | 'damage_reimbursement' | 'other' | string;
export type ExpenseTypeCode = string;
export type DocumentTypeCode = 'cpf' | 'cnpj' | 'passport' | 'other' | string;

// ---- Lookup (editable combo) tables ----

export interface LookupItem {
  id: string;
  code: string;
  label: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Investor {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  document_type_id: string;
  document_number: string;
  pix_number: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip_code: string | null;
  address_country: string | null;
  registration_date: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  brand: string;
  model: string;
  model_year: number;
  color: string | null;
  renavam: string | null;
  crv_number: string | null;
  acquisition_date: string;
  acquisition_cost: number;
  acquisition_value: number | null;
  current_market_value: number | null;
  acquisition_mileage: number | null;
  current_mileage: number | null;
  status_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
  start_date: string;
  status_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleAssignment {
  id: string;
  vehicle_id: string;
  driver_id: string;
  start_date: string;
  end_date: string | null;
  monthly_rental_value: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestorParticipation {
  id: string;
  investor_id: string;
  vehicle_id: string;
  ownership_percentage: number;
  administration_fee_percentage: number;
  effective_date: string;
  end_date: string | null;
}

export interface Revenue {
  id: string;
  vehicle_id: string;
  driver_id: string | null;
  revenue_date: string;
  revenue_type_id: string;
  amount: number;
  notes: string | null;
}

export interface Expense {
  id: string;
  vehicle_id: string;
  expense_date: string;
  expense_type_id: string;
  amount: number;
  notes: string | null;
}

export interface VehicleEvent {
  id: string;
  vehicle_id: string;
  description: string;
  planned_date: string | null;
  value: number | null;
  is_completed: boolean;
  completed_date: string | null;
}

// ---- View-backed read models ----

export interface FleetDashboardSummary {
  total_vehicles: number;
  active_rentals: number;
  vehicles_in_maintenance: number;
  monthly_revenue: number;
  monthly_expenses: number;
  monthly_net_profit: number;
  events_this_month: number;
  events_next_month_forecast: number;
}

export interface FleetPerformanceRow {
  vehicle_id: string;
  plate_number: string;
  status_code: VehicleStatusCode;
  status_label: string;
  current_driver_name: string | null;
  revenue_month: number;
  expenses_month: number;
  profit_month: number;
  occupancy_days_this_month: number;
  occupancy_rate: number;
  occupancy_status: 'occupied' | 'maintenance' | 'idle';
}

export interface VehicleFinancialSummary {
  vehicle_id: string;
  plate_number: string;
  brand: string;
  model: string;
  status_code: VehicleStatusCode;
  status_label: string;
  acquisition_cost: number;
  acquisition_value: number | null;
  current_market_value: number | null;
  total_revenue: number;
  total_expenses: number;
  accumulated_profit: number;
  accumulated_depreciated_profit: number;
  roi_percentage: number | null;
  roi_depreciated_percentage: number | null;
}

export interface InvestorVehicleFinancials {
  investor_id: string;
  vehicle_id: string;
  ownership_percentage: number;
  administration_fee_percentage: number;
  total_revenue: number;
  total_expenses: number;
  accumulated_profit: number;
  accumulated_depreciated_profit: number;
  investor_accumulated_profit: number;
  investor_accumulated_depreciated_profit: number;
  investor_acquisition_cost_share: number;
  investor_portfolio_value_share: number;
}
