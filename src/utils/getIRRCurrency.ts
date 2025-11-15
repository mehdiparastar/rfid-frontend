export const getIRRCurrency = (value: number) => {
    const out = new Intl.NumberFormat('fa-IR', {
        style: 'currency',
        currency: 'IRR',
    }).format(value)

    return out
}