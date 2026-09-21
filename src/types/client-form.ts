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
  noPlate: boolean;
  /** The plate exactly as it came from the server, or undefined for a
   * brand-new vehicle. Used to skip format re-validation for a value the
   * user never touched — a plate saved before the current format rules
   * existed must not block re-saving the rest of the form. */
  originalPlate?: string;
  color: string;
  upholstery: string;
  fuelType: string;
  transmission: string;
  /** Read-only, informational — sourced from the latest visit, not submitted. */
  currentMileage?: number | null;
  currentMileageVisitDate?: string | null;
  currentMileageServiceOrderId?: string | null;
  currentMileageServiceOrderCode?: string | null;
}

/** A brand-new vehicle (no originalPlate) is always "touched" — there's no
 * stored value to grandfather in. An existing one is only touched once its
 * plate actually differs from what was loaded. */
export function isPlateTouched(vehicle: VehicleFormValue): boolean {
  return vehicle.originalPlate === undefined || vehicle.plate !== vehicle.originalPlate;
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
    noPlate: false,
    color: "",
    upholstery: "",
    fuelType: "",
    transmission: "",
  };
}