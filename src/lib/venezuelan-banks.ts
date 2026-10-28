// Reference: https://github.com/ericksonmc/bancos-de-venezuela
// BCV source: https://www.bcv.org.ve/system/files/documentos/ibp_activas_en_el_scce_2025.pdf
// Local catalog: no account numbers are sent to an external service.
export const VENEZUELAN_BANKS = [
  ["0102", "Banco de Venezuela"],
  ["0104", "Venezolano de Crédito"],
  ["0105", "Mercantil"],
  ["0108", "BBVA Provincial"],
  ["0114", "Bancaribe"],
  ["0115", "Banco Exterior"],
  ["0128", "Banco Caroní"],
  ["0134", "Banesco"],
  ["0137", "Sofitasa"],
  ["0138", "Banco Plaza"],
  ["0146", "Bangente"],
  ["0151", "Banco Fondo Común (BFC)"],
  ["0156", "100% Banco"],
  ["0157", "DelSur"],
  ["0163", "Banco del Tesoro"],
  ["0166", "Banco Agrícola de Venezuela"],
  ["0168", "Bancrecer"],
  ["0169", "R4 Banco Microfinanciero"],
  ["0171", "Banco Activo"],
  ["0172", "Bancamiga"],
  ["0173", "Banco Internacional de Desarrollo"],
  ["0174", "Banplus"],
  ["0175", "Banco Digital de los Trabajadores"],
  ["0177", "BANFANB"],
  ["0178", "N58 Banco Digital"],
  ["0191", "Banco Nacional de Crédito (BNC)"],
  ["0601", "Instituto Municipal de Crédito Popular"],
].map(([code, name]) => ({ code, name }));

/** Only bank-transfer identifiers: never infer a bank from a phone or email.
 * Allow the code alone while typing, but reject letters, excess digits and
 * unrecognized/retired codes instead of guessing. */
export function detectVenezuelanBank(account: string, paymentMethod: string) {
  if (paymentMethod !== "transferencia" || !/^[\d\s-]+$/.test(account))
    return null;
  const digits = account.replace(/[\s-]/g, "");
  if (digits.length < 4 || digits.length > 20) return null;
  return (
    VENEZUELAN_BANKS.find((bank) => bank.code === digits.slice(0, 4)) ?? null
  );
}

// Logos provided by the user. Other banks deliberately use the generic icon.
export const BANK_LOGO_CODES = new Set([
  "0102",
  "0104",
  "0105",
  "0108",
  "0114",
  "0134",
  "0172",
  "0174",
  "0177",
  "0191",
]);

export function findVenezuelanBank(bankName: string) {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  const name = normalize(bankName);
  if (!name) return null;
  const aliases: Record<string, string> = {
    bdv: "0102",
    bancodevenezuela: "0102",
    venezolanodecredito: "0104",
    mercantilbanco: "0105",
    mercantil: "0105",
    provincial: "0108",
    bbvaprovincial: "0108",
    bancaribe: "0114",
    banesco: "0134",
    bancamiga: "0172",
    banplus: "0174",
    banfanb: "0177",
    bnc: "0191",
    bncbanconacionaldecredito: "0191",
  };
  return (
    VENEZUELAN_BANKS.find(
      (bank) =>
        bank.code === bankName.trim() ||
        normalize(bank.name) === name ||
        bank.code === aliases[name],
    ) ?? null
  );
}
