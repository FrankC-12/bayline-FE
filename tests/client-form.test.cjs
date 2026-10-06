const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const cache = new Map();
function load(relative) {
  const filename = path.resolve(__dirname, "..", relative);
  if (cache.has(filename)) return cache.get(filename);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  }).outputText;
  const result = {exports: {}};
  new Function("module", "exports", "require", code)(result, result.exports,
    (id) => id.startsWith("@/") ? load(`src/${id.slice(2)}.ts`) : require(id));
  cache.set(filename, result.exports);
  return result.exports;
}
const {emptyVehicle, isPlateTouched, isPlateInvalid, plateForSubmit} = load("src/types/client-form.ts");
const {validateVenezuelaPlate} = load("src/lib/venezuela-plate.ts");
const {ALLOWED_STATUS_TRANSITIONS} = load("src/lib/vehicle-catalog-dealership.ts");

test("Andres kook: untouched ABDKHBC8 does not block saving and is sent literally", () => {
  const vehicle = {...emptyVehicle(), id: "existing", plate: "ABDKHBC8", originalPlate: "ABDKHBC8"};
  assert.equal(validateVenezuelaPlate(vehicle.plate).valid, false);
  assert.equal(isPlateTouched(vehicle), false);
  assert.equal(isPlateInvalid(vehicle), false);
  assert.equal(plateForSubmit(vehicle), "ABDKHBC8");
});
test("modified plates are checked, including an invalid legacy value entered for a new vehicle", () => {
  for (const plate of ["12ABC34", "AB123CD1", "ABDKHBC8"]) {
    assert.equal(isPlateInvalid({...emptyVehicle(), plate}), true);
    assert.equal(isPlateInvalid({...emptyVehicle(), plate, originalPlate: "AB123CD"}), true);
  }
});
test("formats accepted by the existing validator remain accepted", () => {
  for (const plate of ["AB123CD", "AA123AA", "A12BC3D", "ABC12D"]) {
    assert.equal(isPlateInvalid({...emptyVehicle(), plate}), false);
  }
});
test("sin placa submits null for new or existing units", () => {
  assert.equal(plateForSubmit({...emptyVehicle(), noPlate: true}), null);
  const vehicle = {...emptyVehicle(), plate: "ABDKHBC8", originalPlate: "ABDKHBC8", noPlate: true};
  assert.equal(isPlateInvalid(vehicle), false);
  assert.equal(plateForSubmit(vehicle), null);
});
test("changing a plate normalizes it; unchanged legacy spelling is preserved", () => {
  assert.equal(plateForSubmit({...emptyVehicle(), plate: "ab-123-cd"}), "AB123CD");
  assert.equal(plateForSubmit({...emptyVehicle(), plate: "abc 123", originalPlate: "abc 123"}), "abc 123");
});
test("returning to the original value clears the modified-plate check", () => {
  const vehicle = {...emptyVehicle(), plate: "AB123CD", originalPlate: "ABDKHBC8"};
  assert.equal(isPlateTouched(vehicle), true);
  vehicle.plate = "ABDKHBC8";
  assert.equal(isPlateInvalid(vehicle), false);
});
test("a unit in the yard cannot return to shipping; reserved units must be released before preparation", () => {
  assert.equal(ALLOWED_STATUS_TRANSITIONS.disponible.includes("en_transito"), false);
  assert.deepEqual(ALLOWED_STATUS_TRANSITIONS.reservado, ["disponible", "vendido"]);
  assert.deepEqual(ALLOWED_STATUS_TRANSITIONS.vendido, []);
});


const {inventoryMileageError} = load("src/lib/inventory-mileage.ts");
test("used inventory requires mileage, including a valid zero value", () => {
 assert.match(inventoryMileageError("usado", ""), /obligatorio/);
 assert.match(inventoryMileageError("usado", "  "), /obligatorio/);
 assert.equal(inventoryMileageError("usado", "0"), null);
 assert.equal(inventoryMileageError("usado", "65000"), null);
 assert.equal(inventoryMileageError("nuevo", ""), null);
});
test("inventory mileage rejects negatives, fractions and invalid numbers", () => {
 for (const value of ["-1", "1.5", "no", "Infinity", "2147483648"]) {
  assert.ok(inventoryMileageError("usado", value));
 }
});
