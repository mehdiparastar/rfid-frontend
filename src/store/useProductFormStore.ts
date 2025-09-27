import { create } from 'zustand';
import type { Tag } from '../api/products';

export interface ProductFormValues {
    name: string;
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
] as const;
export type GoldProductType = typeof GOLD_PRODUCT_TYPES[number];

export const GOLD_PRODUCT_SUB_TYPES = [
    {
        symbol: "IR_GOLD_18K",
        name_en: "18K Gold",
        name: "طلای 18 عیار"
    },
    {
        symbol: "IR_GOLD_24K",
        name_en: "24K Gold",
        name: "طلای 24 عیار",
    },
    {
        symbol: "IR_GOLD_MELTED",
        name_en: "Melted Gold",
        name: "طلای آب‌شده نقدی",
    },
    {
        symbol: "XAUUSD",
        name_en: "Gold Ounce",
        name: "انس طلا",
    },
    {
        symbol: "IR_COIN_1G",
        name_en: "1g Coin",
        name: "سکه یک گرمی",
    },
    {
        symbol: "IR_COIN_QUARTER",
        name_en: "Quarter Coin",
        name: "ربع سکه",
    },
    {
        symbol: "IR_COIN_HALF",
        name_en: "Half Coin",
        name: "نیم سکه",
    },
    {
        symbol: "IR_COIN_EMAMI",
        name_en: "Emami Coin",
        name: "سکه امامی",
    },
    {
        symbol: "IR_COIN_BAHAR",
        name_en: "Bahar Azadi Coin",
        name: "سکه بهار آزادی",
    }

] as const;

export type GoldProductSUBType = typeof GOLD_PRODUCT_SUB_TYPES[number]["symbol"];


const initialValues: ProductFormValues = {
    name: '',
    weight: "0.01",
    type: GOLD_PRODUCT_TYPES[0],
    subType: GOLD_PRODUCT_SUB_TYPES[0].symbol,
    inventoryItem: false,
    quantity: "1",
    makingCharge: '0',
    vat: '10',
    profit: '7',
    tags: [],
    photos: [],
    previews: [],
};

export const useProductFormStore = create<FormState>((set, get) => ({
    values: initialValues,
    errors: {},
    helpers: {},
    setValue: (key, value) => set((state) => ({ values: { ...state.values, [key]: value } })),
    setError: (key, error) => set((state) => ({ errors: { ...state.errors, [key]: error } })),
    setHelper: (key, helper) => set((state) => ({ helpers: { ...state.helpers, [key]: helper } })),
    reset: () => set({ values: initialValues, errors: {}, helpers: {} }),
    validate: () => {
        const { values } = get();
        const newErrors: Partial<Record<keyof ProductFormValues, string>> = {};
        if (!values.name) newErrors.name = 'Name is required';
        if (!values.weight || isNaN(parseFloat(values.weight))) newErrors.weight = 'Valid weight is required';
        if (!values.type) newErrors.type = 'Type is required';
        if (!values.subType) newErrors.subType = 'SubType is required';
        if (!values.inventoryItem) newErrors.inventoryItem = 'Inventory Item Status is required';
        if (!values.quantity || isNaN(parseInt(values.quantity))) newErrors.quantity = 'Valid quantity is required';
        if (!values.makingCharge || isNaN(parseFloat(values.makingCharge))) newErrors.makingCharge = 'Valid making charge is required';
        if (!values.vat || isNaN(parseFloat(values.vat))) newErrors.vat = 'Valid VAT is required';
        if (!values.profit || isNaN(parseFloat(values.profit))) newErrors.profit = 'Valid PROFIT is required';
        if (values.tags.length === 0) newErrors.tags = 'At least one tag is required';
        if (values.photos.reduce((p, c) => p + c.size, 0) > 400 * 1024 * 1024) newErrors.photos = `At Max state, 400 MB have allowed to be attached for each product. your files size is: ${Math.round(values.photos.reduce((p, c) => p + c.size, 0) / (1024 * 1024) * 100) / 100}MB`;
        if (values.photos.length > 12) newErrors.photos = 'At Max state, 12 photos allowed to be attached for each product.';
        if (values.photos.length === 0) newErrors.photos = 'At least one photo is required';
        if (values.previews.length !== values.photos.length) newErrors.previews = 'Previews must match photos count';
        set({ errors: newErrors });
        return Object.keys(newErrors).length === 0;
    },
}));