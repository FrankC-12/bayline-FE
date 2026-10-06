export function inventoryMileageError(condition: string, value: string): string | null {
  if (!value.trim()) return condition === "usado" ? "El kilometraje es obligatorio para un vehículo usado." : null;
  const amount = Number(value);
  return !Number.isInteger(amount) || amount < 0 || amount > 2147483647
    ? "Introduce un kilometraje entero mayor o igual a cero." : null;
}
