export type ProcessId = "FDM" | "SLS" | "DLP";

export const PROCESSES: ProcessId[] = ["FDM", "SLS", "DLP"];

export const PROCESS_LABELS: Record<ProcessId, string> = {
  FDM: "FDM (Schmelzschicht)",
  SLS: "SLS (Lasersinter)",
  DLP: "DLP (Resin)",
};

export interface Material {
  id: string;
  name: string;
  process: ProcessId;
  density: number;
  pricePerKg: number;
  color?: string;
  notes?: string;
  active: boolean;
}

export interface Printer {
  id: string;
  name: string;
  process: ProcessId;
  buildVolume: { x: number; y: number; z: number };
  active: boolean;
}

export interface FormulaConfig {
  process: ProcessId;
  materialMarkup: number;
  machineHourRate: number;
  printSpeed: number;
  setupFee: number;
  boundingBoxFactor: number;
  postProcessingFee: number;
  marginPercent: number;
  minPrice: number;
}

export interface DiscountTier {
  minQty: number;
  discountPercent: number;
}

export interface AnalyzedPart {
  fileName: string;
  fileSizeBytes: number;
  volumeCm3: number;
  surfaceCm2: number;
  triangleCount: number;
  boundingBox: { x: number; y: number; z: number };
}

export interface PriceLineItem {
  label: string;
  amount: number;
}

export interface PriceBreakdown {
  process: ProcessId;
  materialId: string;
  materialName: string;
  quantity: number;
  unitPriceBeforeMargin: number;
  unitPrice: number;
  totalPrice: number;
  estimatedPrintHours: number;
  appliedDiscountPercent: number;
  minPriceApplied: boolean;
  lines: PriceLineItem[];
  fits: boolean;
  fittingPrinterName: string | null;
}

export interface Customer {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface QuoteVariant {
  process: ProcessId;
  materialId: string;
  quantity: number;
  breakdown: PriceBreakdown;
}

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected";

export interface Quote {
  id: string;
  number: string;
  createdAt: string;
  updatedAt: string;
  status: QuoteStatus;
  customer: Customer;
  partLabel: string;
  partNotes?: string;
  part: AnalyzedPart;
  variants: QuoteVariant[];
}

export interface AppConfig {
  schemaVersion: number;
  materials: Material[];
  printers: Printer[];
  formulas: Record<ProcessId, FormulaConfig>;
  discountTiers: Record<ProcessId, DiscountTier[]>;
  company: {
    name: string;
    address: string;
    email: string;
    phone: string;
    vatId: string;
  };
}
