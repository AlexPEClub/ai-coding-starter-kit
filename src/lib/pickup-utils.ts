/** 
 * Feiertags-Berechnung für NRW (Gauß-Algorithmus)
 * PROJ-20: Logistik & Abholung
 */

/**
 * Berechnet Ostersonntag nach dem Gauß-Algorithmus
 */
export function calculateEasterSunday(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

/**
 * Berechnet alle Feiertage NRW für ein Jahr
 */
export function calculateHolidays(year: number): Array<{ datum: Date; name: string }> {
    const easter = calculateEasterSunday(year);
    const addDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };

    const holidays = [
        { datum: new Date(year, 0, 1), name: "Neujahr" },
        { datum: addDays(easter, -2), name: "Karfreitag" },
        { datum: addDays(easter, 1), name: "Ostermontag" },
        { datum: new Date(year, 4, 1), name: "Tag der Arbeit" },
        { datum: addDays(easter, 39), name: "Christi Himmelfahrt" },
        { datum: addDays(easter, 50), name: "Pfingstmontag" },
        { datum: addDays(easter, 60), name: "Fronleichnam" },
        { datum: new Date(year, 9, 3), name: "Tag der Deutschen Einheit" },
        { datum: new Date(year, 10, 1), name: "Allerheiligen" },
        { datum: new Date(year, 11, 25), name: "1. Weihnachtstag" },
        { datum: new Date(year, 11, 26), name: "2. Weihnachtstag" },
    ];

    return holidays;
}

/**
 * Prüft, ob ein Datum ein Feiertag ist
 */
export function isHoliday(date: Date, holidays?: Array<{ datum: Date; name: string }>): boolean {
    if (!holidays) {
        holidays = calculateHolidays(date.getFullYear());
    }
    return holidays.some(h => 
        h.datum.getFullYear() === date.getFullYear() &&
        h.datum.getMonth() === date.getMonth() &&
        h.datum.getDate() === date.getDate()
    );
}

