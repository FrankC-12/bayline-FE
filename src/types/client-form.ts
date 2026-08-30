export interface VehicleFormValue {
  id?: string;
  brand: string;
  model: string;
  year: string;
  vin: string;
  mileage: string;
  purchaseDate: string;
  bodyType: string;
  plate: string;
  color: string;
  upholstery: string;
  fuelType: string;
  transmission: string;
}

export function emptyVehicle(): VehicleFormValue {
  return {
    brand: "",
    model: "",
    year: "",
    vin: "",
    mileage: "",
    purchaseDate: "",
    bodyType: "",
    plate: "",
    color: "",
    upholstery: "",
    fuelType: "",
    transmission: "",
  };
}