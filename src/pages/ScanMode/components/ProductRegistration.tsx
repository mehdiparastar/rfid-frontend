import { AddPhotoAlternate, CameraAlt } from '@mui/icons-material';
import FingerprintSharpIcon from '@mui/icons-material/FingerprintSharp';
import {
    Alert,
    AlertTitle,
    Box,
    Button,
    ButtonGroup,
    Chip,
    CircularProgress,
    Collapse,
    FormControl,
    FormControlLabel,
    FormHelperText,
    Grid,
    Input,
    InputAdornment,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Switch,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import { isEqual } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { useCreateProduct, useUpdateProduct } from '../../../api/products';
import type { Tag } from '../../../api/tags';
import CameraFilePicker, { type CapturedFile } from '../../../components/CameraFilePicker';
import SelectTags from '../../../components/SelectTags';
import type { Product } from '../../../lib/api';
import { GOLD_PRODUCT_SUB_TYPES, GOLD_PRODUCT_TYPES, useProductFormStore, type GoldProductSUBType, type GoldProductType, type ProductFormValues } from '../../../store/useProductFormStore';
import { generatePreview } from '../../../utils/imageUtils';
import { translate } from '../../../utils/translate';

interface ProductRegistrationProps {
    mode: "New" | "Edit",
    toEditData?: ProductFormValues,
    setProductToEdit?: React.Dispatch<React.SetStateAction<Product | null>>
}

const ProductRegistration: React.FC<ProductRegistrationProps> = (props) => {
    const { mode, toEditData, setProductToEdit } = props

    const {
        values,
        errors,
        helpers,
        setValue,
        setError,
        setHelper,
        validate,
        initialize,
        reset,
    } = useProductFormStore();

    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln) as any

    const serverErrRef = useRef<HTMLDivElement | null>(null);
    const [serverErr, setServerErr] = useState(null)
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);

    const [uploadPct, setUploadPct] = useState<number | null>(null);
    const [uploadInfo, setUploadInfo] = useState<{ loaded: number; total: number } | null>(null);

    const [cameraDialogOpen, setCameraDialogOpen] = useState(false);

    const createNewProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setUploadPct(0);
        setUploadInfo(null);

        const isEditMode = mode === "Edit";
        if (isEditMode) {
            // Compute only changed fields
            const changedPayload = computeChangedFields(values, toEditData as ProductFormValues);
            if (Object.keys(changedPayload).length === 0) {
                // No changes: Early exit with message
                alert('No changes detected. Product is up to date.');
                return;
            }

            const mutationArgs = {
                id: (toEditData as any)?.id,  // Ensure 'id' is in toEditData props/type
                payload: changedPayload,
                onProgress: (pct: number, loaded: number, total: number) => {
                    setUploadPct(pct);
                    setUploadInfo({ loaded, total });
                },
            };

            updateProductMutation.mutate(mutationArgs as any, {
                onSuccess: () => {
                    // Optionally: Re-initialize with server response if it returns updated data
                    reset();
                    setPreviewUrls([]);
                    setUploadPct(null);
                    setUploadInfo(null);
                    setServerErr(null);
                    if (setProductToEdit) setProductToEdit(null)
                    alert(t['Product updated successfully']);
                },
                onError: (error: any) => {
                    setUploadPct(null);
                    setUploadInfo(null);
                    const parsedError = JSON.parse(error?.message || "{}");
                    const errorMessage = parsedError?.message || t[`An error occurred updating product.`];
                    setServerErr(t[errorMessage] || errorMessage);
                },
            });
        } else {
            // New mode: Send full payload (unchanged)
            createNewProductMutation.mutate(
                {
                    payload: { ...values },
                    onProgress: (pct: number, loaded: number, total: number) => {
                        setUploadPct(pct);
                        setUploadInfo({ loaded, total });
                    },
                },
                {
                    onSuccess: () => {
                        reset();
                        setPreviewUrls([]);
                        setUploadPct(null);
                        setUploadInfo(null);
                        setServerErr(null);
                        alert(t['Product registered successfully']);
                    },
                    onError: (error: any) => {
                        setUploadPct(null);
                        setUploadInfo(null);
                        const parsedError = JSON.parse(error?.message || "{}");
                        const errorMessage = parsedError?.message || t[`An error occurred submitting new product.`];
                        setServerErr(errorMessage);
                    },
                }
            );
        }
    };

    // Helper: Compute diff (add this inside the component or as a util)
    const computeChangedFields = (
        current: ProductFormValues,
        original: ProductFormValues
    ): Partial<ProductFormValues> => {
        const changes: Partial<ProductFormValues> = {};

        // Primitives: Simple string/number/boolean comparison
        const primitiveFields: (keyof Pick<ProductFormValues, 'name' | 'karat' | 'weight' | 'quantity' | 'makingCharge' | 'vat' | 'profit'>)[] = [
            'name', 'karat', 'weight', 'quantity', 'makingCharge', 'vat', 'profit'
        ];
        primitiveFields.forEach(field => {
            if (current[field] !== original[field]) {
                changes[field] = current[field];
            }
        });

        // Enums: Treat as strings
        if (current.type !== original.type) changes.type = current.type;
        if (current.subType !== original.subType) changes.subType = current.subType;

        // Boolean
        if (current.inventoryItem !== original.inventoryItem) changes.inventoryItem = current.inventoryItem;

        // Arrays: Deep comparison (use lodash isEqual or JSON.stringify for simplicity)
        if (!isEqual(current.tags, original.tags)) {  // Or: JSON.stringify(current.tags) !== JSON.stringify(original.tags)
            changes.tags = current.tags;
        }
        // Photos/Previews: Compare lengths first (files are mutable, so length/content change indicates update)
        // For edits, assume original.photos are URLs/IDs; if new files uploaded, always include
        const photosChanged = current.photos.length !== original.photos.length ||
            current.photos.some((file, idx) => file.size !== (original.photos[idx] as any)?.size);  // Rough check; adjust if original has metadata
        if (photosChanged) {
            changes.photos = current.photos;
            changes.previews = current.previews;  // Include if photos changed (they're paired)
        }

        return changes;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setValue('photos', files);
        setPreviewUrls(files.map((file) => URL.createObjectURL(file)));

        try {
            const previews = await Promise.all(files.map((file) => generatePreview(file)));
            setValue('previews', previews);
            setHelper('photos', `${files.length} ${t["photos selected, previews generated"]}`);
            setError('photos', '');
            setError('previews', '');
        } catch (err) {
            setError('previews', t['Failed to generate previews']);
        }
    };

    const handleTagConfirm = (selected: Tag[]) => {
        const unique = [...new Map(selected.map(item => [item.epc, item])).values()];
        setValue('tags', unique);
        setHelper('tags', `${unique.length} ${t['tags selected']}`);
        setDialogOpen(false);
    };

    const handleTagRemove = (tag: Tag) => {
        const unique = [...new Map(values.tags.filter(el => el.epc !== tag.epc).map(item => [item.epc, item])).values()]
        setValue('tags', unique);
        setHelper('tags', `${unique.length} ${t['tags selected']}`);
    }

    useEffect(() => {
        if (mode === "Edit" && toEditData) {
            initialize(toEditData);
            // Handle previews for edit (assuming toEditData.previews are URLs or base64)
            if (toEditData.previews?.length) {
                setPreviewUrls(toEditData.previews.map(p => typeof p === 'string' ? `api${p}` : URL.createObjectURL(p as File)));
            }
        } else {
            initialize();  // Reset to defaults for new
            setPreviewUrls([]);
        }
    }, [mode, toEditData, initialize]);

    useEffect(() => {
        return () => {
            previewUrls.forEach(URL.revokeObjectURL);
        };
    }, [previewUrls]);

    useEffect(() => {
        if (serverErr && serverErrRef.current) {
            const rect = serverErrRef.current.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            // height of your top bar (e.g. 80px)
            const offset = 80;

            window.scrollTo({
                top: rect.top + scrollTop - offset,
                behavior: 'smooth',
            });
        }
    }, [serverErr]);

    return (
        <Paper elevation={3} sx={{ pt: 1, pb: 4, px: 1, width: 1, mx: 'auto', mb: 2 }}>
            <Collapse in={!!serverErr}>
                <Alert ref={serverErrRef} variant='filled' severity='error' onClose={() => { setServerErr(null) }}>
                    <AlertTitle>{t["Server Error"]}</AlertTitle>
                    {serverErr}
                </Alert>
            </Collapse>
            {serverErr && <br />}

            {/* Upload progress */}
            {uploadPct !== null && (
                <Box sx={{ mb: 2 }}>
                    <LinearProgress variant="determinate" value={uploadPct} />
                    <Typography variant="caption">
                        {t["Uploading…"]} {uploadPct}%{uploadInfo ? ` (${Math.round(uploadInfo.loaded / 1024)} KB / ${Math.round(uploadInfo.total / 1024)} KB)` : ''}
                    </Typography>
                </Box>
            )}
            <form onSubmit={handleSubmit}>
                <Grid container spacing={1}>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label={t["Name"]}
                            disabled={createNewProductMutation.isPending}
                            value={values.name}
                            onChange={(e) => setValue('name', e.target.value)}
                            error={!!errors.name}
                            helperText={errors.name || helpers.name}
                            fullWidth
                            margin="normal"
                            slotProps={{
                                htmlInput: { min: 0.01, step: "0.01" },
                                input: { endAdornment: <InputAdornment position="end"><FingerprintSharpIcon /></InputAdornment> }
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth margin="normal" error={!!errors.type}>
                            <InputLabel id="type-select-label">{t["Type"]}</InputLabel>
                            <Select
                                MenuProps={{
                                    disableScrollLock: true,  // This prevents body scroll lock
                                }}
                                disabled={createNewProductMutation.isPending}
                                labelId="type-select-label"
                                label={t["Type"]}
                                value={values.type}
                                onChange={(e) => {
                                    setValue('type', e.target.value as GoldProductType)
                                    if (e.target.value !== "Coin" && values.subType.includes("COIN")) {
                                        setValue('subType', "IR_GOLD_18K" as GoldProductSUBType)
                                        setValue('karat', "750")
                                    }
                                    if (e.target.value === "Coin" && !values.subType.includes("COIN")) {
                                        setValue('subType', "IR_COIN_EMAMI" as GoldProductSUBType)
                                        setValue('karat', "900")
                                        setValue('weight', "8.133")
                                    }
                                    if (e.target.value === "Coin" && values.subType.includes("COIN") && !values.subType.includes("PCOIN")) setValue('karat', "900")
                                    if (e.target.value === "Coin" && values.subType.includes("PCOIN")) setValue('karat', "750")
                                }}
                            >
                                {GOLD_PRODUCT_TYPES.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {t[type]}
                                    </MenuItem>
                                ))}
                            </Select>
                            <FormHelperText>{errors.type || helpers.type}</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth margin="normal" error={!!errors.type}>
                            <InputLabel id="sub-type-select-label">{t["SubType"]}</InputLabel>
                            <Select
                                MenuProps={{
                                    disableScrollLock: true,  // This prevents body scroll lock
                                }}
                                disabled={createNewProductMutation.isPending}
                                labelId="sub-type-select-label"
                                label={t["SubType"]}
                                value={values.subType}
                                onChange={(e) => {
                                    setValue('subType', e.target.value as GoldProductSUBType)
                                    if (e.target.value === "IR_GOLD_18K") setValue('karat', "750")
                                    if (e.target.value === "IR_GOLD_24K") setValue('karat', "995")
                                    if (e.target.value.includes("PCOIN")) setValue('karat', "750")
                                    if (e.target.value.includes("MELTED")) setValue('karat', "750")
                                    if (!e.target.value.includes("PCOIN") && e.target.value.includes("COIN")) setValue('karat', "900")
                                    if (e.target.value === "IR_COIN_EMAMI") setValue('weight', "8.133")
                                    if (e.target.value === "IR_COIN_BAHAR") setValue('weight', "8.133")
                                    if (e.target.value === "IR_COIN_HALF") setValue('weight', "4.066")
                                    if (e.target.value === "IR_COIN_QUARTER") setValue('weight', "2.033")
                                    if (e.target.value === "IR_COIN_1G") setValue('weight', "1.01")
                                    if (e.target.value === "IR_PCOIN_1-5G") setValue('weight', "1.50")
                                    if (e.target.value === "IR_PCOIN_1-4G") setValue('weight', "1.40")
                                    if (e.target.value === "IR_PCOIN_1-3G") setValue('weight', "1.30")
                                    if (e.target.value === "IR_PCOIN_1-2G") setValue('weight', "1.20")
                                    if (e.target.value === "IR_PCOIN_1-1G") setValue('weight', "1.10")
                                    if (e.target.value === "IR_PCOIN_1G") setValue('weight', "1.00")
                                    if (e.target.value === "IR_PCOIN_900MG") setValue('weight', "0.90")
                                    if (e.target.value === "IR_PCOIN_800MG") setValue('weight', "0.80")
                                    if (e.target.value === "IR_PCOIN_700MG") setValue('weight', "0.70")
                                    if (e.target.value === "IR_PCOIN_600MG") setValue('weight', "0.60")
                                    if (e.target.value === "IR_PCOIN_500MG") setValue('weight', "0.50")
                                    if (e.target.value === "IR_PCOIN_400MG") setValue('weight', "0.40")
                                    if (e.target.value === "IR_PCOIN_300MG") setValue('weight', "0.30")
                                    if (e.target.value === "IR_PCOIN_200MG") setValue('weight', "0.20")
                                    if (e.target.value === "IR_PCOIN_100MG") setValue('weight', "0.10")
                                    if (e.target.value === "IR_PCOIN_70MG") setValue('weight', "0.070")
                                    if (e.target.value === "IR_PCOIN_50MG") setValue('weight', "0.050")
                                    if (e.target.value === "IR_PCOIN_30MG") setValue('weight', "0.030")
                                }}
                            >
                                {
                                    values.type === "Coin" ?
                                        GOLD_PRODUCT_SUB_TYPES.filter(el => el.symbol.includes("COIN") && el.symbol !== "XAUUSD").map((type) => (
                                            <MenuItem key={type.symbol} value={type.symbol}>
                                                {theme.direction === "ltr" ? type.name_en : type.name}
                                            </MenuItem>
                                        )) :
                                        GOLD_PRODUCT_SUB_TYPES.filter(el => !el.symbol.includes("COIN") && el.symbol !== "XAUUSD").map((type) => (
                                            <MenuItem key={type.symbol} value={type.symbol}>
                                                {theme.direction === "ltr" ? type.name_en : type.name}
                                            </MenuItem>
                                        ))
                                }
                            </Select>
                            <FormHelperText>{errors.type || helpers.type}</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            label={t["Karat"]}
                            disabled={createNewProductMutation.isPending || !values.subType.includes("MELTED")}
                            value={values.karat}
                            onChange={(e) => setValue('karat', e.target.value)}
                            error={!!errors.karat}
                            helperText={errors.karat || helpers.karat}
                            fullWidth
                            margin="normal"
                            type='number'
                            slotProps={{
                                htmlInput: { min: 0, max: 1000, step: "1" },
                                input: { endAdornment: <InputAdornment position="end">{t["karat"]}</InputAdornment> }
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            label={t["Weight"]}
                            disabled={createNewProductMutation.isPending || values.subType.includes("COIN")}
                            value={values.weight}
                            onChange={(e) => setValue('weight', e.target.value)}
                            error={!!errors.weight}
                            helperText={errors.weight || helpers.weight}
                            fullWidth
                            margin="normal"
                            type='number'
                            slotProps={{
                                htmlInput: { min: 0.001, step: "0.001" },
                                input: { endAdornment: <InputAdornment position="end">{t["grams"]}</InputAdornment> }
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            label={t["Quantity"]}
                            disabled={createNewProductMutation.isPending}
                            value={values.quantity}
                            onChange={(e) => setValue('quantity', e.target.value)}
                            error={!!errors.quantity}
                            helperText={errors.quantity || helpers.quantity}
                            fullWidth
                            margin="normal"
                            type='number'
                            slotProps={{
                                htmlInput: { min: 1, step: "1" },
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            label={t["Making Charge"]}
                            disabled={createNewProductMutation.isPending}
                            value={values.makingCharge}
                            onChange={(e) => setValue('makingCharge', e.target.value)}
                            error={!!errors.makingCharge}
                            helperText={errors.makingCharge || helpers.makingCharge}
                            fullWidth
                            margin="normal"
                            type='number'
                            slotProps={{
                                htmlInput: { min: 0, step: "0.1", max: 100 },
                                input: { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            label={t["VAT"]}
                            disabled={createNewProductMutation.isPending}
                            value={values.vat}
                            onChange={(e) => setValue('vat', e.target.value)}
                            error={!!errors.vat}
                            helperText={errors.vat || helpers.vat}
                            fullWidth
                            margin="normal"
                            type='number'
                            slotProps={{
                                htmlInput: { min: 0, step: "0.1", max: 100 },
                                input: { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            label={t["PROFIT"]}
                            disabled={createNewProductMutation.isPending}
                            value={values.profit}
                            onChange={(e) => setValue('profit', e.target.value)}
                            error={!!errors.profit}
                            helperText={errors.profit || helpers.profit}
                            fullWidth
                            margin="normal"
                            type='number'
                            slotProps={{
                                htmlInput: { min: 0, step: "0.1", max: 100 },
                                input: { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <FormControl sx={{ border: 1, borderColor: 'divider', borderRadius: 1, '&:hover': { borderColor: 'primary.main' } }} fullWidth margin="normal" error={!!errors.inventoryItem}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        disabled={createNewProductMutation.isPending}
                                        checked={values.inventoryItem}
                                        onChange={(e) => setValue('inventoryItem', e.target.checked)}
                                    />
                                }
                                label={t["Inventory Item"]}
                                labelPlacement="start"
                                sx={{ justifyContent: 'space-between', m: 1, alignItems: 'center', p: 0 }}
                            />
                            <FormHelperText>{errors.inventoryItem || helpers.inventoryItem}</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth margin="normal" error={!!errors.tags}>
                            <Typography mb={-1} variant="subtitle1">{t["Tags"]}</Typography>
                            <Button variant="outlined" onClick={() => setDialogOpen(true)} sx={{ mt: 1 }}>
                                {t["Select Tags"]}
                            </Button>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                {values.tags.map((tag) => (
                                    <Chip
                                        disabled={createNewProductMutation.isPending}
                                        key={tag.epc}
                                        label={tag.epc}
                                        onDelete={() => handleTagRemove(tag)}
                                    />
                                ))}
                            </Box>
                            <FormHelperText>{errors.tags || helpers.tags}</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }} sx={{ mt: 2 }}>
                        <Typography sx={{ mb: -2 }} variant="subtitle1">{t["Photos"]}</Typography>
                        <ButtonGroup fullWidth>
                            <FormControl fullWidth margin="normal" error={!!errors.photos}>
                                <Input id="photos-upload" sx={{ display: 'none' }} type="file" inputProps={{ multiple: true, accept: 'image/*' }} onChange={handleFileChange} />
                                <label htmlFor="photos-upload">
                                    <Button
                                        disabled={createNewProductMutation.isPending}
                                        fullWidth
                                        variant="outlined"
                                        component="span"
                                        startIcon={<AddPhotoAlternate />}
                                        sx={{ width: 1 }}
                                    >
                                        {t["Upload Photos"]}
                                    </Button>
                                </label>
                            </FormControl>
                            <FormControl fullWidth margin="normal" error={!!errors.photos}>
                                <Button
                                    disabled={createNewProductMutation.isPending}
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => setCameraDialogOpen(true)}
                                    startIcon={<CameraAlt />}
                                    sx={{ width: 1 }}
                                >
                                    {t["Capture Photos from Camera"]}
                                </Button>
                            </FormControl>
                        </ButtonGroup>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                            {(previewUrls || []).map((url, idx) => (
                                <Box component={"img"} key={idx} src={url} alt={`preview ${idx}`} sx={{ width: 100, height: 100, objectFit: 'cover' }} />
                            ))}
                        </Box>
                        <FormHelperText>{errors.photos || helpers.photos}</FormHelperText>
                    </Grid>

                </Grid>
                <Button type="submit" variant="contained" disabled={createNewProductMutation.isPending} fullWidth sx={{ mt: 3 }}>
                    {createNewProductMutation.isPending ? <CircularProgress size={24} /> : (mode === "Edit" ? t["Edit Product"] : t['Register Product'])}
                </Button>
            </form>
            {dialogOpen && <SelectTags
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onConfirm={handleTagConfirm}
                selectedTags={values.tags}
            />}
            <CameraFilePicker
                open={cameraDialogOpen}
                onClose={() => setCameraDialogOpen(false)}
                onConfirm={async (captured: CapturedFile[]) => {
                    const files = captured.map(({ file }) => file);
                    const previewUrls = captured.map(({ previewUrl }) => previewUrl!);
                    const previews = captured.map(({ preview }) => preview!);
                    setValue('photos', files);
                    setPreviewUrls(previewUrls);

                    try {
                        setValue('previews', previews);
                        setHelper('photos', `${files.length} photos captured, previews generated`);
                        setError('photos', '');
                        setError('previews', '');
                    } catch (err) {
                        setError('previews', 'Failed to generate previews');
                    }
                }}
                initialFiles={(values.photos || []).filter(el => typeof (el) !== "string")}
            />
        </Paper>
    );
};

export default ProductRegistration;