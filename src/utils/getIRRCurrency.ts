export const getIRRCurrency = (value: number) => new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR',
}).format(value)
