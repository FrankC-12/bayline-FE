const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { loadTS } = require("./helpers/load-ts.cjs");
test("the new vehicle image preserves historical normalized damage positions and photo URLs", () => {
  const Map = loadTS("src/components/inspections/VehicleDamageMap.tsx").default;
  const html = renderToStaticMarkup(
    React.createElement(Map, {
      editable: false,
      damages: [
        {
          id: "d1",
          x: 0.25,
          y: 0.3,
          zone: "capo",
          kind: "rayon",
          severity: "leve",
          description: "Marca en el capó",
          photo_url: "/uploads/damage.jpg",
        },
      ],
    }),
  );
  assert.match(html, /src="\/images\/damage_map.svg"/);
  assert.match(html, /left:25%;top:30%/);
  assert.match(html, /Daño 1/);
  assert.match(html, /Marca en el capó/);
  assert.match(html, /src="\/api\/v1\/uploads\/damage.jpg"/);
  assert.match(
    fs.readFileSync("public/images/damage_map.svg", "utf8"),
    /viewBox="0 0 326 448"/,
  );
});
test("ODS part rows use server labels when the active catalog does not contain the part", () => {
  const Row = loadTS(
    "src/components/service-orders/TransferLineRow.tsx",
  ).default;
  const html = renderToStaticMarkup(
    React.createElement(
      "table",
      null,
      React.createElement(
        "tbody",
        null,
        React.createElement(Row, {
          line: {
            id: "line",
            part_id: "inactive",
            part_name: "Filtro original",
            part_code: "QA-001",
            quantity: 12,
            unit_price: 12.7,
            subtotal: 152.4,
            payer: "cliente",
          },
          part: undefined,
          canEdit: false,
          onChangeQuantity: async () => {},
          onRemoveLine: async () => {},
        }),
      ),
    ),
  );
  assert.match(html, /Filtro original/);
  assert.match(html, /QA-001/);
  assert.match(html, /\$12,70/);
  assert.match(html, /\$152,40/);
  assert.match(html, />12<\/td>/);
});
test("legacy ODS prices remain unknown instead of being rendered as a zero charge", () => {
  const Row = loadTS(
    "src/components/service-orders/TransferLineRow.tsx",
  ).default;
  const html = renderToStaticMarkup(
    React.createElement(
      "table",
      null,
      React.createElement(
        "tbody",
        null,
        React.createElement(Row, {
          line: {
            id: "line",
            part_id: "legacy",
            part_name: "Filtro histórico",
            quantity: 1,
            unit_price: null,
            subtotal: null,
            payer: "cliente",
          },
          canEdit: false,
          onChangeQuantity: async () => {},
          onRemoveLine: async () => {},
        }),
      ),
    ),
  );
  assert.match(html, /Filtro histórico/);
  assert.equal((html.match(/—/g) || []).length, 2);
  assert.doesNotMatch(html, /\$0,00/);
});
