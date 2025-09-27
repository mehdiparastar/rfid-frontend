/**
 * Normalize any Iran mobile number to E.164 (+989XXXXXXXXX).
 * Returns null if the input cannot be recognized as an Iran mobile.
 */
export function normalizeIranMobileToE164(input: string): string | null {
    if (!input) return null;

    // keep leading +, strip other non-digits
    const trimmed = input.trim();
    const plus = trimmed.startsWith('+');
    const digits = (plus ? '+' : '') + trimmed.replace(/[^\d+]/g, '');

    // map common forms to +98...
    let canon = digits
        .replace(/^00/, '+')        // 0098... -> +98...
        .replace(/^\+?98/, '+98')   // 98..., +98... -> +98...
        .replace(/^0/, '+98');      // 09... -> +989...

    // also handle users typing just 9xxxxxxxxx (missing the leading 0)
    if (/^9\d{9}$/.test(digits)) {
        canon = '+98' + digits;
    }

    // must be +989XXXXXXXXX (i.e., +98 + 9 + 9 digits)
    if (!/^\+989\d{9}$/.test(canon)) return null;

    // optional stricter operator prefix check: 090,091,092,093,099
    const op3 = canon.slice(3, 6); // after +98 -> '9xx'
    const okPrefix = ['990', '991', '992', '993', '994', '995', '996', '997', '998', '999', // MVNOs 099x
        '900', '901', '902', '903', '904', '905', '906', '907', '908', '909', // 090x
        '910', '911', '912', '913', '914', '915', '916', '917', '918', '919', // 091x
        '920', '921', '922', '923', '924', '925', '926', '927', '928', '929', // 092x
        '930', '931', '932', '933', '934', '935', '936', '937', '938', '939'  // 093x
    ].includes(op3);

    return okPrefix ? canon : null;
}

/**
 * Validate an Iran mobile number (accepts domestic or international formats).
 * Accepts: 09XXXXXXXXX, 9XXXXXXXXX, +989XXXXXXXXX, 00989XXXXXXXXX, 98 9XXXXXXXXX, with separators.
 */
export function isValidIranMobile(input: string): boolean {
    const e164 = normalizeIranMobileToE164(input);
    if (!e164) return false;

    // reject trivially repeated digits (e.g., +989000000000)
    const last10 = e164.slice(-10); // 9XXXXXXXXX
    if (/^(\d)\1{9}$/.test(last10)) return false;

    return true;
}
