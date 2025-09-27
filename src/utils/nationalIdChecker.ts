/**
 * Validate an Iranian national ID (کد ملی)
 * @param input - the 10-digit string
 * @returns true if valid, false otherwise
 */
export function isValidIranianNationalId(input: string): boolean {
    if (!/^\d{10}$/.test(input)) return false; // must be exactly 10 digits

    const digits = input.split('').map(Number);

    // reject all digits same (e.g., 0000000000, 1111111111, etc.)
    if (/^(\d)\1{9}$/.test(input)) return false;

    const check = digits[9];
    const sum = digits
        .slice(0, 9)
        .reduce((acc, d, i) => acc + d * (10 - i), 0);

    const remainder = sum % 11;
    return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
}
