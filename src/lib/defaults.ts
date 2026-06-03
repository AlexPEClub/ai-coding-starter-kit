import type { AppConfig, DiscountTier, FormulaConfig, Material, Printer, ProcessId } from "./types";

export const SCHEMA_VERSION = 1;

const defaultMaterials: Material[] = [
  {
    id: "fdm-pla",
    name: "PLA",
    process: "FDM",
    density: 1.24,
    pricePerKg: 35,
    color: "Weiss",
    notes: "Standard, gut druckbar",
    active: true,
  },
  {
    id: "fdm-petg",
    name: "PETG",
    process: "FDM",
    density: 1.27,
    pricePerKg: 42,
    color: "Schwarz",
    notes: "Robust, fuer Funktionsteile",
    active: true,
  },
  {
    id: "fdm-abs",
    name: "ABS",
    process: "FDM",
    density: 1.04,
    pricePerKg: 38,
    color: "Schwarz",
    active: true,
  },
  {
    id: "sls-pa12",
    name: "PA12 (Nylon)",
    process: "SLS",
    density: 1.01,
    pricePerKg: 95,
    color: "Naturweiss",
    notes: "Standard SLS-Material",
    active: true,
  },
  {
    id: "sls-pa12-gf",
    name: "PA12 GF (glasgefuellt)",
    process: "SLS",
    density: 1.22,
    pricePerKg: 145,
    color: "Grau",
    active: true,
  },
  {
    id: "dlp-standard",
    name: "Standard Resin",
    process: "DLP",
    density: 1.12,
    pricePerKg: 120,
    color: "Grau",
    active: true,
  },
  {
    id: "dlp-tough",
    name: "Tough Resin",
    process: "DLP",
    density: 1.18,
    pricePerKg: 180,
    color: "Schwarz",
    notes: "Funktionsmuster",
    active: true,
  },
];

const defaultPrinters: Printer[] = [
  {
    id: "fdm-1",
    name: "Bambu Lab X1C",
    process: "FDM",
    buildVolume: { x: 256, y: 256, z: 256 },
    active: true,
  },
  {
    id: "fdm-2",
    name: "Prusa MK4 XL",
    process: "FDM",
    buildVolume: { x: 360, y: 360, z: 360 },
    active: true,
  },
  {
    id: "sls-1",
    name: "EOS Formiga P110",
    process: "SLS",
    buildVolume: { x: 200, y: 250, z: 330 },
    active: true,
  },
  {
    id: "sls-2",
    name: "Sintratec S2",
    process: "SLS",
    buildVolume: { x: 160, y: 160, z: 400 },
    active: true,
  },
  {
    id: "dlp-1",
    name: "ETEC Envision One",
    process: "DLP",
    buildVolume: { x: 180, y: 101, z: 350 },
    active: true,
  },
  {
    id: "dlp-2",
    name: "Asiga Pro 4K80",
    process: "DLP",
    buildVolume: { x: 120, y: 68, z: 200 },
    active: true,
  },
];

const defaultFormulas: Record<ProcessId, FormulaConfig> = {
  FDM: {
    process: "FDM",
    materialMarkup: 1.2,
    machineHourRate: 8,
    printSpeed: 18,
    setupFee: 12,
    boundingBoxFactor: 0,
    postProcessingFee: 4,
    marginPercent: 25,
    minPrice: 15,
  },
  SLS: {
    process: "SLS",
    materialMarkup: 1.4,
    machineHourRate: 35,
    printSpeed: 25,
    setupFee: 35,
    boundingBoxFactor: 0.0008,
    postProcessingFee: 8,
    marginPercent: 30,
    minPrice: 45,
  },
  DLP: {
    process: "DLP",
    materialMarkup: 1.5,
    machineHourRate: 18,
    printSpeed: 8,
    setupFee: 18,
    boundingBoxFactor: 0,
    postProcessingFee: 6,
    marginPercent: 30,
    minPrice: 25,
  },
};

const defaultDiscountTiers: Record<ProcessId, DiscountTier[]> = {
  FDM: [
    { minQty: 1, discountPercent: 0 },
    { minQty: 10, discountPercent: 8 },
    { minQty: 50, discountPercent: 15 },
    { minQty: 100, discountPercent: 22 },
  ],
  SLS: [
    { minQty: 1, discountPercent: 0 },
    { minQty: 5, discountPercent: 6 },
    { minQty: 25, discountPercent: 12 },
    { minQty: 100, discountPercent: 20 },
  ],
  DLP: [
    { minQty: 1, discountPercent: 0 },
    { minQty: 10, discountPercent: 7 },
    { minQty: 50, discountPercent: 14 },
    { minQty: 200, discountPercent: 22 },
  ],
};

export const defaultConfig: AppConfig = {
  schemaVersion: SCHEMA_VERSION,
  materials: defaultMaterials,
  printers: defaultPrinters,
  formulas: defaultFormulas,
  discountTiers: defaultDiscountTiers,
  company: {
    name: "Mechatronic Factory GmbH",
    address: "",
    email: "",
    phone: "",
    vatId: "",
  },
};
