import { create } from 'zustand';
import type { Tag } from '../api/products';

export interface ProductFormValues {
    name: string;
    weight: string;
    type: GoldProductType;
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


const initialValues: ProductFormValues = {
    name: '',
    weight: "0.01",
    type: GOLD_PRODUCT_TYPES[0],
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