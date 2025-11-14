export const calculateGoldPrice = (weight: number | undefined, makingCharge: number | undefined, profit: number | undefined, vat: number | undefined, unitPrice: number | undefined) => {
    if (weight === 1.54) {
        console.log()
    }
    if (weight && makingCharge && profit && vat && unitPrice) {
        if (weight > 0 && makingCharge > 0 && profit > 0 && vat > 0 && unitPrice > 0) {
            return weight * unitPrice * (1 + (makingCharge / 100)) * (1 + (profit / 100)) * (1 + (vat / 100))
        }
    }
}