export interface VehicleModelOption {
  id: string;
  brand_id: string;
  name: string;
  is_active: boolean;
}

export interface VehicleBrandOption {
  id: string;
  holding_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  models: VehicleModelOption[];
}
