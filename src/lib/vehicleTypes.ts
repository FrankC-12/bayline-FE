// The fixed set of vehicle body types ("Tipo") — must match
// VehicleBodyType in the backend's vehicle_catalog schemas. Chosen once per
// Model in Ajustes → Marcas y Modelos; a vehicle at intake inherits it from
// the selected Model instead of it being typed by hand.
export const VEHICLE_BODY_TYPES = ["Sedán", "Pick-up", "SUV", "Camión", "Van", "Moto", "Otro"] as const;
