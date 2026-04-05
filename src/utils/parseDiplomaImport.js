const ALIASES = {
  fullName: ["фио", "ф.и.о.", "fio", "full name", "fullname", "фамилия имя отчество"],
  year: ["год", "год выпуска", "year", "год окончания"],
  specialty: ["специальность", "направление", "specialty", "специальность / направление"],
  diplomaNumber: [
    "номер диплома",
    "номер",
    "diploma number",
    "diploma_number",
    "№ диплома",
    "серия и номер",
  ],
};

function norm(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function headerToKey(cell) {
  const n = norm(cell);
  if (!n) return null;
  for (const [key, list] of Object.entries(ALIASES)) {
    if (list.some((a) => n === a || n.includes(a))) return key;
  }
  return null;
}

function parseCsvLine(line, delim) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && c === delim) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

function parseCsvToMatrix(text) {
  const normalized = text.replace(/^\uFEFF/, "");
  const rawLines = normalized.split(/\r?\n/).filter((l) => l.trim().length);
  if (rawLines.length === 0) return [];
  const first = rawLines[0];
  const delim =
    first.split(";").length > first.split(",").length && first.includes(";") ? ";" : ",";
  return rawLines.map((line) => parseCsvLine(line, delim));
}

function parseYear(raw) {
  if (raw === null || raw === undefined || raw === "") return NaN;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.trunc(raw);
  const s = String(raw).trim();
  const n = parseInt(s.replace(/\D/g, "").slice(0, 4), 10);
  return Number.isFinite(n) ? n : NaN;
}

function validateRow(o, lineNum, errors) {
  const fullName = String(o.fullName ?? "").trim();
  const year = parseYear(o.year);
  const specialty = String(o.specialty ?? "").trim();
  const diplomaNumber = String(o.diplomaNumber ?? "").trim();
  if (!fullName) {
    errors.push(`Строка ${lineNum}: не указано ФИО`);
    return null;
  }
  if (!Number.isFinite(year) || year < 1950 || year > 2100) {
    errors.push(`Строка ${lineNum}: некорректный год`);
    return null;
  }
  if (!specialty) {
    errors.push(`Строка ${lineNum}: не указана специальность`);
    return null;
  }
  if (!diplomaNumber) {
    errors.push(`Строка ${lineNum}: не указан номер диплома`);
    return null;
  }
  return { fullName, year, specialty, diplomaNumber };
}

function mapRowFromIndices(line, colIndex) {
  const get = (key) => {
    const i = colIndex[key];
    return i === undefined ? "" : line[i];
  };
  return {
    fullName: get("fullName"),
    year: get("year"),
    specialty: get("specialty"),
    diplomaNumber: get("diplomaNumber"),
  };
}

/**
 * @param {(string|number)[][]} matrix
 * @returns {{ rows: { fullName: string, year: number, specialty: string, diplomaNumber: string }[], errors: string[] }}
 */
export function parseDiplomaRowsFromMatrix(matrix) {
  const errors = [];
  if (!matrix.length) {
    return { rows: [], errors: ["Файл не содержит строк"] };
  }

  const headerRow = matrix[0].map((c) => String(c ?? "").trim());
  const colIndex = {};
  headerRow.forEach((h, i) => {
    const key = headerToKey(h);
    if (key && colIndex[key] === undefined) colIndex[key] = i;
  });

  const required = ["fullName", "year", "specialty", "diplomaNumber"];
  const hasHeader = required.every((k) => colIndex[k] !== undefined);

  const rows = [];
  if (hasHeader) {
    for (let r = 1; r < matrix.length; r++) {
      const line = matrix[r];
      if (!line || line.every((c) => !String(c ?? "").trim())) continue;
      const o = mapRowFromIndices(line, colIndex);
      const v = validateRow(o, r + 1, errors);
      if (v) rows.push(v);
    }
    return { rows, errors };
  }

  for (let r = 0; r < matrix.length; r++) {
    const line = matrix[r];
    if (!line || line.every((c) => !String(c ?? "").trim())) continue;
    if (line.length < 4) {
      errors.push(`Строка ${r + 1}: ожидаются 4 колонки (ФИО; Год; Специальность; Номер диплома)`);
      continue;
    }
    const o = {
      fullName: String(line[0] ?? "").trim(),
      year: line[1],
      specialty: String(line[2] ?? "").trim(),
      diplomaNumber: String(line[3] ?? "").trim(),
    };
    const v = validateRow(o, r + 1, errors);
    if (v) rows.push(v);
  }
  return { rows, errors };
}

/**
 * @param {File} file
 */
export async function parseDiplomaImportFile(file) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "csv") {
    const text = await file.text();
    const matrix = parseCsvToMatrix(text);
    return parseDiplomaRowsFromMatrix(matrix);
  }
  if (ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      return { rows: [], errors: ["В книге нет листов"] };
    }
    const sheet = wb.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
    return parseDiplomaRowsFromMatrix(matrix);
  }
  throw new Error("format");
}
