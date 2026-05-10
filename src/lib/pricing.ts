import type {
  AnalyzedPart,
  DiscountTier,
  FormulaConfig,
  Material,
  PriceBreakdown,
  PriceLineItem,
  Printer,
  ProcessId,
} from "./types";

export interface FitResult {
  fits: boolean;
  printer: Printer | null;
}

function permutations(b: { x: number; y: number; z: number }) {
  const { x, y, z } = b;
  return [
    [x, y, z],
    [x, z, y],
    [y, x, z],
    [y, z, x],
    [z, x, y],
    [z, y, x],
  ];
}

const FIT_TOLERANCE_MM = 1;

export function findFittingPrinter(
  bbox: { x: number; y: number; z: number },
  printers: Printer[],
): FitResult {
  const candidates = printers.filter((p) => p.active);
  for (const printer of candidates) {
    const v = printer.buildVolume;
    for (const [px, py, pz] of permutations(bbox)) {
      if (
        px <= v.x + FIT_TOLERANCE_MM &&
        py <= v.y + FIT_TOLERANCE_MM &&
        pz <= v.z + FIT_TOLERANCE_MM
      ) {
        return { fits: true, printer };
      }
    }
  }
  return { fits: false, printer: null };
}

export function maxBuildVolume(printers: Printer[], process: ProcessId) {
  const ofProcess = printers.filter((p) => p.process === process && p.active);
  if (ofProcess.length === 0) return null;
  return ofProcess.reduce(
    (acc, p) => ({
      x: Math.max(acc.x, p.buildVolume.x),
      y: Math.max(acc.y, p.buildVolume.y),
      z: Math.max(acc.z, p.buildVolume.z),
    }),
    { x: 0, y: 0, z: 0 },
  );
}

function applyDiscount(qty: number, tiers: DiscountTier[]): number {
  if (!tiers.length) return 0;
  const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty);
  for (const tier of sorted) {
    if (qty >= tier.minQty) return tier.discountPercent;
  }
  return 0;
}

function estimatePrintHours(
  process: ProcessId,
  part: AnalyzedPart,
  formula: FormulaConfig,
): number {
  if (formula.printSpeed <= 0) return 0;
  if (process === "DLP") {
    const heightMm = Math.max(part.boundingBox.x, part.boundingBox.y, part.boundingBox.z);
    const heightCm = heightMm / 10;
    const baseHours = part.volumeCm3 / formula.printSpeed;
    const heightFactor = 0.6 + heightCm / 30;
    return baseHours * heightFactor;
  }
  if (process === "SLS") {
    const bboxVolumeCm3 =
      (part.boundingBox.x * part.boundingBox.y * part.boundingBox.z) / 1000;
    const drivingVolume = Math.max(part.volumeCm3, bboxVolumeCm3 * 0.2);
    return drivingVolume / formula.printSpeed;
  }
  return part.volumeCm3 / formula.printSpeed;
}

export interface CalculateInput {
  process: ProcessId;
  part: AnalyzedPart;
  material: Material;
  formula: FormulaConfig;
  quantity: number;
  tiers: DiscountTier[];
  printers: Printer[];
}

export function calculatePrice(input: CalculateInput): PriceBreakdown {
  const { process, part, material, formula, quantity, tiers, printers } = input;
  const massKg = (part.volumeCm3 * material.density) / 1000;
  const materialCost = massKg * material.pricePerKg * formula.materialMarkup;

  const hours = estimatePrintHours(process, part, formula);
  const machineCost = hours * formula.machineHourRate;

  const bboxVolumeCm3 =
    (part.boundingBox.x * part.boundingBox.y * part.boundingBox.z) / 1000;
  const bboxCost = formula.boundingBoxFactor
    ? bboxVolumeCm3 * formula.boundingBoxFactor * 1000
    : 0;

  const subtotalPerPart =
    materialCost + machineCost + bboxCost + formula.postProcessingFee;

  const marginAmount = subtotalPerPart * (formula.marginPercent / 100);
  const unitPriceBeforeMin = subtotalPerPart + marginAmount;

  let unitPrice = unitPriceBeforeMin;
  let minPriceApplied = false;
  if (unitPrice < formula.minPrice) {
    unitPrice = formula.minPrice;
    minPriceApplied = true;
  }

  const discountPercent = applyDiscount(quantity, tiers);
  const discountedUnit = unitPrice * (1 - discountPercent / 100);
  const partsTotal = discountedUnit * quantity;
  const totalPrice = partsTotal + formula.setupFee;

  const lines: PriceLineItem[] = [
    { label: "Materialkosten / Teil", amount: materialCost },
    { label: `Maschinenzeit (${hours.toFixed(2)} h) / Teil`, amount: machineCost },
  ];
  if (bboxCost > 0) lines.push({ label: "Bauraum-Block / Teil", amount: bboxCost });
  lines.push({ label: "Nachbearbeitung / Teil", amount: formula.postProcessingFee });
  lines.push({
    label: `Marge ${formula.marginPercent}% / Teil`,
    amount: marginAmount,
  });
  if (minPriceApplied) {
    lines.push({
      label: `Mindestpreis angewendet (${formula.minPrice.toFixed(2)} EUR)`,
      amount: 0,
    });
  }
  if (discountPercent > 0) {
    lines.push({
      label: `Mengenrabatt -${discountPercent}% / Teil`,
      amount: -(unitPrice * (discountPercent / 100)),
    });
  }
  lines.push({ label: `Stueckpreis x ${quantity}`, amount: discountedUnit * quantity });
  lines.push({ label: "Setup-Pauschale", amount: formula.setupFee });

  const fit = findFittingPrinter(
    part.boundingBox,
    printers.filter((p) => p.process === process),
  );

  return {
    process,
    materialId: material.id,
    materialName: material.name,
    quantity,
    unitPriceBeforeMargin: subtotalPerPart,
    unitPrice: discountedUnit,
    totalPrice,
    estimatedPrintHours: hours,
    appliedDiscountPercent: discountPercent,
    minPriceApplied,
    lines,
    fits: fit.fits,
    fittingPrinterName: fit.printer?.name ?? null,
  };
}

export function formatEUR(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
}
