import type { AnalyzedPart } from "./types";

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface RawAnalysis {
  volumeMm3: number;
  surfaceMm2: number;
  triangleCount: number;
  bbox: { min: Vec3; max: Vec3 };
}

function isBinarySTL(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 84) return false;
  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);
  const expectedSize = 84 + triangleCount * 50;
  return expectedSize === buffer.byteLength;
}

function emptyBbox() {
  return {
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity },
  };
}

function expandBbox(bbox: { min: Vec3; max: Vec3 }, v: Vec3) {
  if (v.x < bbox.min.x) bbox.min.x = v.x;
  if (v.y < bbox.min.y) bbox.min.y = v.y;
  if (v.z < bbox.min.z) bbox.min.z = v.z;
  if (v.x > bbox.max.x) bbox.max.x = v.x;
  if (v.y > bbox.max.y) bbox.max.y = v.y;
  if (v.z > bbox.max.z) bbox.max.z = v.z;
}

function signedTetraVolume(a: Vec3, b: Vec3, c: Vec3): number {
  return (
    (a.x * (b.y * c.z - b.z * c.y) +
      a.y * (b.z * c.x - b.x * c.z) +
      a.z * (b.x * c.y - b.y * c.x)) /
    6
  );
}

function triangleArea(a: Vec3, b: Vec3, c: Vec3): number {
  const ux = b.x - a.x;
  const uy = b.y - a.y;
  const uz = b.z - a.z;
  const vx = c.x - a.x;
  const vy = c.y - a.y;
  const vz = c.z - a.z;
  const cx = uy * vz - uz * vy;
  const cy = uz * vx - ux * vz;
  const cz = ux * vy - uy * vx;
  return 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz);
}

function parseBinary(buffer: ArrayBuffer): RawAnalysis {
  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);
  const bbox = emptyBbox();
  let volume = 0;
  let surface = 0;
  let offset = 84;
  for (let i = 0; i < triangleCount; i++) {
    offset += 12;
    const a: Vec3 = {
      x: view.getFloat32(offset, true),
      y: view.getFloat32(offset + 4, true),
      z: view.getFloat32(offset + 8, true),
    };
    const b: Vec3 = {
      x: view.getFloat32(offset + 12, true),
      y: view.getFloat32(offset + 16, true),
      z: view.getFloat32(offset + 20, true),
    };
    const c: Vec3 = {
      x: view.getFloat32(offset + 24, true),
      y: view.getFloat32(offset + 28, true),
      z: view.getFloat32(offset + 32, true),
    };
    expandBbox(bbox, a);
    expandBbox(bbox, b);
    expandBbox(bbox, c);
    volume += signedTetraVolume(a, b, c);
    surface += triangleArea(a, b, c);
    offset += 36 + 2;
  }
  return { volumeMm3: Math.abs(volume), surfaceMm2: surface, triangleCount, bbox };
}

function parseAscii(text: string): RawAnalysis {
  const bbox = emptyBbox();
  let volume = 0;
  let surface = 0;
  let triangleCount = 0;
  const vertexRegex = /vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g;
  const verts: Vec3[] = [];
  let match: RegExpExecArray | null;
  while ((match = vertexRegex.exec(text)) !== null) {
    verts.push({
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
      z: parseFloat(match[3]),
    });
    if (verts.length === 3) {
      const [a, b, c] = verts;
      expandBbox(bbox, a);
      expandBbox(bbox, b);
      expandBbox(bbox, c);
      volume += signedTetraVolume(a, b, c);
      surface += triangleArea(a, b, c);
      triangleCount++;
      verts.length = 0;
    }
  }
  if (triangleCount === 0) {
    throw new Error("Keine Dreiecke in ASCII-STL gefunden");
  }
  return { volumeMm3: Math.abs(volume), surfaceMm2: surface, triangleCount, bbox };
}

export async function analyzeSTL(file: File): Promise<AnalyzedPart> {
  const buffer = await file.arrayBuffer();
  let raw: RawAnalysis;
  if (isBinarySTL(buffer)) {
    raw = parseBinary(buffer);
  } else {
    const text = new TextDecoder().decode(buffer);
    raw = parseAscii(text);
  }
  if (!Number.isFinite(raw.bbox.min.x) || !Number.isFinite(raw.bbox.max.x)) {
    throw new Error("STL-Datei enthaelt keine gueltigen Geometriedaten");
  }
  const sizeMm = {
    x: raw.bbox.max.x - raw.bbox.min.x,
    y: raw.bbox.max.y - raw.bbox.min.y,
    z: raw.bbox.max.z - raw.bbox.min.z,
  };
  return {
    fileName: file.name,
    fileSizeBytes: file.size,
    volumeCm3: raw.volumeMm3 / 1000,
    surfaceCm2: raw.surfaceMm2 / 100,
    triangleCount: raw.triangleCount,
    boundingBox: {
      x: Math.round(sizeMm.x * 100) / 100,
      y: Math.round(sizeMm.y * 100) / 100,
      z: Math.round(sizeMm.z * 100) / 100,
    },
  };
}
