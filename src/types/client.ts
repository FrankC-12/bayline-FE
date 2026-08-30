export type ClientType = "particular" | "empresa";
export type DocumentType = "V" | "J" | "E" | "G";
export type ContactPreference = "whatsapp" | "llamada" | "correo" | "sms";
export type AddressType = "hogar" | "trabajo" | "otro";
export type FuelType = "gasolina" | "diesel" | "hibrido" | "electrico";
export type TransmissionType = "manual" | "automatica";

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  vin: string | null;
  mileage: number | null;
  purchase_date: string | null;
  body_type: string | null;
  plate: string;
  color: string | null;
  upholstery: string | null;
  fuel_type: FuelType | null;
  transmission: TransmissionType | null;
}

export interface Client {
  id: string;
  filial_id: string;
  full_name: string;
  client_type: ClientType;
  document_type: DocumentType;
  document_number: string;
  email: string | null;
  phone_primary: string;
  phone_secondary: string | null;
  contact_preference: ContactPreference | null;
  address: string;
  address_type: AddressType | null;
  vehicles: Vehicle[];
  created_at: string;
  updated_at: string;
}