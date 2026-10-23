const { test } = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { loadTS } = require("./helpers/load-ts.cjs");
const { evidenceUrl } = loadTS("src/lib/evidence.ts");
const { formatMoney, formatMoneyInput } = loadTS("src/lib/format.ts");
test("legacy inspection files resolve through the API proxy and unsafe protocols are rejected", () => {
  assert.equal(evidenceUrl("/uploads/foto.jpg"), "/api/v1/uploads/foto.jpg");
  assert.equal(
    evidenceUrl("/api/v1/uploads/foto.jpg"),
    "/api/v1/uploads/foto.jpg",
  );
  assert.equal(
    evidenceUrl("https://example.com/photo.jpg"),
    "https://example.com/photo.jpg",
  );
  assert.equal(evidenceUrl("javascript:alert(1)"), null);
  assert.equal(evidenceUrl("file:///private/photo.jpg"), null);
});
test("money formatting and pasted thousands preserve the actual numeric amount", () => {
  assert.equal(formatMoney(12700), "12.700,00");
  assert.equal(formatMoney(12.7), "12,70");
  assert.equal(formatMoneyInput("12.700,00"), "12700.00");
  assert.equal(formatMoneyInput("12700.50"), "12700.50");
});
test("detailed inspection displays fluids, zero measurements, photographs and document annexes", () => {
  const Readout = loadTS(
    "src/components/service-orders/InspectionReadout.tsx",
  ).default;
  const html = renderToStaticMarkup(
    React.createElement(Readout, {
      inspection: {
        data: {
          observations: "Revisar nivel",
          engine: { battery_voltage: 0 },
          fluids: {
            coolant: {
              level: "bajo",
              notes: "Completar refrigerante",
              photo_urls: ["/uploads/fluido.jpg"],
            },
          },
        },
        annexes: [
          { id: "1", filename: "informe.pdf", url: "/uploads/informe.pdf" },
        ],
      },
    }),
  );
  assert.match(html, /Fluidos y niveles/);
  assert.match(html, /Refrigerante/);
  assert.match(html, /Completar refrigerante/);
  assert.match(html, /\/api\/v1\/uploads\/fluido.jpg/);
  assert.match(html, /informe.pdf/);
  assert.match(html, />0<\/dd>/);
});

test("fractional dot decimals are not mistaken for thousands", () => {
  const { parseNumberInput } = loadTS("src/lib/numberInput.ts");
  assert.equal(parseNumberInput("0.500", 3), "0.500");
  assert.equal(parseNumberInput("1.000", 2), "1000");
});

test("interior fields and nested photos remain visible beside technical inspection evidence", () => {
  const { default: Readout } = loadTS(
    "src/components/service-orders/InspectionReadout.tsx",
  );
  const html = renderToStaticMarkup(
    React.createElement(Readout, {
      inspection: {
        data: {
          interior: {
            seats: {
              condition: "regular",
              notes: "Tapicería revisada",
              photo_urls: ["/uploads/interior.png"],
            },
            odometer_display: 0,
          },
        },
        annexes: [],
      },
    }),
  );
  assert.match(html, /Interior del vehículo/);
  assert.match(html, /Tapicería revisada/);
  assert.match(html, /api\/v1\/uploads\/interior.png/);
  assert.match(html, />0</);
});

test("claim coverage bars use departure km and preserve separate date and distance limits", () => {
  const { assessClaimCoverage } = loadTS("src/lib/claimCoverage.ts");
  const { default: Coverage } = loadTS(
    "src/components/service-orders/WarrantyCoverage.tsx",
  );
  const terms = {
    kind: "workshop",
    starts_at: "2026-10-01",
    expires_at: "2026-12-30",
    duration_km: 5000,
    expiration_mileage: 15000,
  };
  const assessment = assessClaimCoverage(terms, 10100, "2026-10-23");
  assert.equal(assessment.valid, true);
  assert.equal(assessment.distance.used, 100);
  assert.equal(assessment.time.used, 22);
  const html = renderToStaticMarkup(
    React.createElement(Coverage, { assessment }),
  );
  assert.match(html, /100 de 5.000 km/);
  assert.match(html, /role="progressbar"/);
  assert.equal(assessClaimCoverage(terms, 15000, "2026-10-23").valid, false);
  assert.equal(assessClaimCoverage(terms, 10100, "2026-12-31").valid, false);
  assert.equal(assessClaimCoverage(terms, null, "2026-10-23").valid, null);
});
