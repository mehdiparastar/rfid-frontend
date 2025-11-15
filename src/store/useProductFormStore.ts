import { create } from 'zustand';
import type { Tag } from '../api/tags';

export interface ProductFormValues {
    name: string;
    karat: string;
    weight: string;
    type: GoldProductType;
    subType: GoldProductSUBType;
    inventoryItem: boolean;
    quantity: string;
    makingCharge: string;
    vat: string;
    profit: string;
    tags: Tag[];
    photos: File[];
    previews: File[];
}

interface FormState {
    values: ProductFormValues;
    errors: Partial<Record<keyof ProductFormValues, string>>;
    helpers: Partial<Record<keyof ProductFormValues, string>>;
    setValue: <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => void;
    setError: <K extends keyof ProductFormValues>(key: K, error: string) => void;
    setHelper: <K extends keyof ProductFormValues>(key: K, helper: string) => void;
    initialize: (initialValues?: Partial<ProductFormValues>) => void;
    reset: () => void;
    validate: () => boolean;
}

// Predefined gold-selling product types
export const GOLD_PRODUCT_TYPES = [
    'Necklace',
    'Ring',
    'Bracelet',
    'Earrings',
    'Pendant',
    'Anklet',
    'Bangle',
    'Chain',
    'WatchPendant',
    'Piercing',
    'Medal',
    'Coin',
    "FullSet",
    "HalfSet",
    'Others',
] as const;
export type GoldProductType = typeof GOLD_PRODUCT_TYPES[number];

export const GOLD_PRODUCT_SUB_TYPES =
    [
        {
            symbol: "IR_GOLD_18K",
            name: "طلای 18 عیار",
            name_en: "18K Gold",
        },
        {
            symbol: "IR_GOLD_24K",
            name: "طلای 24 عیار",
            name_en: "24K Gold",
        },
        {
            symbol: "IR_GOLD_MELTED",
            name: "طلای آب‌شده نقدی",
            name_en: "Melted Gold",
        },
        {
            symbol: "IR_COIN_EMAMI",
            name: "سکه امامی",
            name_en: "Emami Coin",
        },
        {
            symbol: "IR_COIN_BAHAR",
            name: "سکه بهار آزادی",
            name_en: "Bahar Azadi Coin",
        },
        {
            symbol: "IR_COIN_HALF",
            name: "نیم سکه",
            name_en: "Half Coin",
        },
        {
            symbol: "IR_COIN_QUARTER",
            name: "ربع سکه",
            name_en: "Quarter Coin",
        },
        {
            symbol: "IR_COIN_1G",
            name: "سکه یک گرمی",
            name_en: "1g Coin",
        },
        {
            symbol: "IR_PCOIN_1-5G",
            name: "سکه 1.5 گرمی پارسیان",
            name_en: "1.5g Parsian Coin",
        },
        {
            symbol: "IR_PCOIN_1-4G",
            name: "سکه 1.4 گرمی پارسیان",
            name_en: "1.4g Parsian Coin",
        },
        {
            symbol: "IR_PCOIN_1-3G",
            name: "سکه 1.3 گرمی پارسیان",
            name_en: "1.3g Parsian Coin",
        },
        {
            symbol: "IR_PCOIN_1-2G",
            name: "سکه 1.2 گرمی پارسیان",
            name_en: "1.2g Parsian Coin",
        },
        {
            symbol: "IR_PCOIN_1-1G",
            name: "سکه 1.1 گرمی پارسیان",
            name_en: "1.1g Parsian Coin",
        },
        {
            symbol: "IR_PCOIN_1G",
            name: "سکه 1 گرمی پارسیان",
            name_en: "1g Parsian Coin",
        },
        {
            symbol: "IR_PCOIN_900MG",
            name: "سکه 900 سوتی پارسیان",
            name_en: "900mg Parsian Coin",
        },
        {
            symbol: "IR_PCOIN_800MG",
            name: "سکه 800 سوتی پارسیان",
            name_en: "800mg Parsian Coin",
        },
        {
            symbol: "IR_PCOIN_700MG",
            name: "سکه 700 سوتی پارسیان",
            name_en: "700mg Parsian Coin",
        },
        {
            symbol: "IR_PCOIN_600MG",
            name: "سکه 600 سوتی پارسیان",
            name_en: "600mg Parsian Coin",
        },
        {
            symbol: "IR_PCOIN_500MG",
            name: "سکه 500 سوتی پارسیان",
            name_en: "500mg Parsian Coin",
        },
        {
            symbol: "IR_PCOIN_400MG",
            name: "سکه 400 سوتی پارسیان",
            name_en: "400mg Parsian Coin",
        },
        {
            symbol: "IR_PCOIN_300MG",
            name: "سکه 300 سوتی پارسیان",
            name_en: "300mg Parsian Coin",
        },
        {
            symbol: "IR_PCOIN_200MG",
            name: "سکه 200 سوتی پارسیان",
            name_en: "200mg Parsian Coin",
        },
        {
            symbol: "IR_PCOIN_100MG",
            name: "سکه 100 سوتی پارسیان",
            name_en: "100mg Parsian Coin",
        },
        {
            symbol: "IR_PCOIN_70MG",
            name: "سکه 70 سوتی پارسیان",
            name_en: "70mg Parsian Coin",
        },
        {
            symbol: "IR_PCOIN_50MG",
            name: "سکه 50 سوتی پارسیان",
            name_en: "50mg Parsian Coin",
        },
        {
            symbol: "IR_PCOIN_30MG",
            name: "سکه 30 سوتی پارسیان",
            name_en: "30mg Parsian Coin",
        },
        {
            symbol: "XAUUSD",
            name: "انس طلا",
            name_en: "Gold Ounce",
        },
    ] as const

// export const GOLD_PRODUCT_SUB_TYPES_ = [
//     {
//         symbol: "IR_GOLD_18K",
//         name_en: "18K Gold",
//         name: "طلای 18 عیار"
//     },
//     {
//         symbol: "IR_GOLD_24K",
//         name_en: "24K Gold",
//         name: "طلای 24 عیار",
//     },
//     {
//         symbol: "IR_GOLD_MELTED",
//         name_en: "Melted Gold",
//         name: "طلای آب‌شده نقدی",
//     },
//     {
//         symbol: "XAUUSD",
//         name_en: "Gold Ounce",
//         name: "انس طلا",
//     },
//     {
//         symbol: "IR_COIN_1G",
//         name_en: "1g Coin",
//         name: "سکه یک گرمی",
//     },
//     {
//         symbol: "IR_COIN_QUARTER",
//         name_en: "Quarter Coin",
//         name: "ربع سکه",
//     },
//     {
//         symbol: "IR_COIN_HALF",
//         name_en: "Half Coin",
//         name: "نیم سکه",
//     },
//     {
//         symbol: "IR_COIN_EMAMI",
//         name_en: "Emami Coin",
//         name: "سکه امامی",
//     },
//     {
//         symbol: "IR_COIN_BAHAR",
//         name_en: "Bahar Azadi Coin",
//         name: "سکه بهار آزادی",
//     }
// ] as const;

export type GoldProductSUBType = typeof GOLD_PRODUCT_SUB_TYPES[number]["symbol"];


const defaultInitialValues: ProductFormValues = {
    name: '',
    karat: "750",
    weight: "0.01",
    type: GOLD_PRODUCT_TYPES[0],
    subType: GOLD_PRODUCT_SUB_TYPES[0].symbol,
    inventoryItem: false,
    quantity: "1",
    makingCharge: '17',
    vat: '2',
    profit: '7',
    tags: [],
    photos: [],
    previews: [],
};



export const useProductFormStore = create<FormState>((set, get) => ({
    values: defaultInitialValues,
    errors: {},
    helpers: {},
    setValue: (key, value) => {
        return set((state) => ({ values: { ...state.values, [key]: value } }))
    },
    setError: (key, error) => set((state) => ({ errors: { ...state.errors, [key]: error } })),
    setHelper: (key, helper) => set((state) => ({ helpers: { ...state.helpers, [key]: helper } })),
    initialize: (initialValues?: Partial<ProductFormValues>) => {
        if (initialValues) {
            const mergedValues = { ...defaultInitialValues, ...initialValues };
            set({ values: mergedValues, errors: {}, helpers: {} });
        } else {
            set({ values: defaultInitialValues, errors: {}, helpers: {} });
        }
    },
    reset: () => set({ values: defaultInitialValues, errors: {}, helpers: {} }),
    validate: () => {
        const { values } = get();
        const newErrors: Partial<Record<keyof ProductFormValues, string>> = {};
        if (!values.name) newErrors.name = 'Name is required';
        if (values.karat == null || isNaN(parseFloat(values.karat))) newErrors.karat = 'Valid karat is required';
        if (values.weight == null || isNaN(parseFloat(values.weight))) newErrors.weight = 'Valid weight is required';
        if (!values.type) newErrors.type = 'Type is required';
        if (!values.subType) newErrors.subType = 'SubType is required';
        if (values.inventoryItem === undefined || values.inventoryItem === null) newErrors.inventoryItem = 'Inventory Item Status is required';
        if (values.quantity == null || isNaN(parseInt(values.quantity))) newErrors.quantity = 'Valid quantity is required';
        if (values.makingCharge == null || isNaN(parseFloat(values.makingCharge))) newErrors.makingCharge = 'Valid making charge is required';
        if (values.vat == null || isNaN(parseFloat(values.vat))) newErrors.vat = 'Valid VAT is required';
        if (values.profit == null || isNaN(parseFloat(values.profit))) newErrors.profit = 'Valid PROFIT is required';
        if (values.tags.length === 0) newErrors.tags = 'At least one tag is required';
        if (values.photos.reduce((p, c) => p + c.size, 0) > 400 * 1024 * 1024) newErrors.photos = `At Max state, 400 MB have allowed to be attached for each product. your files size is: ${Math.round(values.photos.reduce((p, c) => p + c.size, 0) / (1024 * 1024) * 100) / 100}MB`;
        if (values.photos.length > 12) newErrors.photos = 'At Max state, 12 photos allowed to be attached for each product.';
        if (values.photos.length === 0) newErrors.photos = 'At least one photo is required';
        if (values.previews.length !== values.photos.length) newErrors.previews = 'Previews must match photos count';
        set({ errors: newErrors });
        return Object.keys(newErrors).length === 0;
    },
}));