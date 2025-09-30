import { AddPhotoAlternate } from '@mui/icons-material';
import FingerprintSharpIcon from '@mui/icons-material/FingerprintSharp';
import {
    Alert,
    AlertTitle,
    Box,
    Button,
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
    Typography
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useCreateProduct, type Tag } from '../../../api/products';
import SelectTags from '../../../components/SelectTags';
import { GOLD_PRODUCT_SUB_TYPES, GOLD_PRODUCT_TYPES, useProductFormStore, type GoldProductSUBType, type GoldProductType } from '../../../store/useProductFormStore';
import { generatePreview } from '../../../utils/imageUtils';

const ProductRegistration: React.FC = () => {
    const {
        values,
        errors,
        helpers,
        setValue,
        setError,
        setHelper,
        validate,
        reset,
    } = useProductFormStore();

    const serverErrRef = useRef<HTMLDivElement | null>(null);
    const [serverErr, setServerErr] = useState(null)
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);

    const [uploadPct, setUploadPct] = useState<number | null>(null);
    const [uploadInfo, setUploadInfo] = useState<{ loaded: number; total: number } | null>(null);

    const createNewProductMutation = useCreateProduct();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setUploadPct(0);
        setUploadInfo(null);

        createNewProductMutation.mutate(
            {
                payload: { ...values },
                onProgress: (pct, loaded, total) => {
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
                    setServerErr(null)
                    alert('Product registered successfully');
                },
                onError: (error: any) => {
                    setUploadPct(null);
                    setUploadInfo(null);
                    const parsedError = JSON.parse(error?.message || "{}");
                    const errorMessage = parsedError?.message || "An error occurred submitting new product.";
                    setServerErr(errorMessage);
                },
            }
        );
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setValue('photos', files);
        setPreviewUrls(files.map((file) => URL.createObjectURL(file)));

        try {
            const previews = await Promise.all(files.map((file) => generatePreview(file)));
            setValue('previews', previews);
            setHelper('photos', `${files.length} photos selected, previews generated`);
            setError('photos', '');
            setError('previews', '');
        } catch (err) {
            setError('previews', 'Failed to generate previews');
        }
    };

    const handleTagConfirm = (selected: Tag[]) => {
        const unique = [...new Map(selected.map(item => [item.epc, item])).values()];
        setValue('tags', unique);
        setHelper('tags', `${unique.length} tags selected`);
        setDialogOpen(false);
    };

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
                    <AlertTitle>Server Error</AlertTitle>
                    {serverErr}
                </Alert>
            </Collapse>
            {serverErr && <br />}

            {/* Upload progress */}
            {uploadPct !== null && (
                <Box sx={{ mb: 2 }}>
                    <LinearProgress variant="determinate" value={uploadPct} />
                    <Typography variant="caption">
                        Uploading… {uploadPct}%{uploadInfo ? ` (${Math.round(uploadInfo.loaded / 1024)} KB / ${Math.round(uploadInfo.total / 1024)} KB)` : ''}
                    </Typography>
                </Box>
            )}
            <form onSubmit={handleSubmit}>
                <Grid container spacing={1}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            label="Name"
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
                            <InputLabel id="type-select-label">Type</InputLabel>
                            <Select
                                disabled={createNewProductMutation.isPending}
                                labelId="type-select-label"
                                label="Type"
                                value={values.type}
                                onChange={(e) => setValue('type', e.target.value as GoldProductType)}
                            >
                                {GOLD_PRODUCT_TYPES.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </Select>
                            <FormHelperText>{errors.type || helpers.type}</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth margin="normal" error={!!errors.type}>
                            <InputLabel id="sub-type-select-label">SubType</InputLabel>
                            <Select
                                disabled={createNewProductMutation.isPending}
                                labelId="sub-type-select-label"
                                label="SubType"
                                value={values.subType}
                                onChange={(e) => setValue('subType', e.target.value as GoldProductSUBType)}
                            >
                                {GOLD_PRODUCT_SUB_TYPES.map((type) => (
                                    <MenuItem key={type.symbol} value={type.symbol}>
                                        {type.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            <FormHelperText>{errors.type || helpers.type}</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            label="Weight"
                            disabled={createNewProductMutation.isPending}
                            value={values.weight}
                            onChange={(e) => setValue('weight', e.target.value)}
                            error={!!errors.weight}
                            helperText={errors.weight || helpers.weight}
                            fullWidth
                            margin="normal"
                            type='number'
                            slotProps={{
                                htmlInput: { min: 0.01, step: "0.01" },
                                input: { endAdornment: <InputAdornment position="end">grams</InputAdornment> }
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            label="Quantity"
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
                            label="Making Charge"
                            disabled={createNewProductMutation.isPending}
                            value={values.makingCharge}
                            onChange={(e) => setValue('makingCharge', e.target.value)}
                            error={!!errors.makingCharge}
                            helperText={errors.makingCharge || helpers.makingCharge}
                            fullWidth
                            margin="normal"
                            type='number'
                            slotProps={{
                                htmlInput: { min: 0, step: "0.25", max: 100 },
                                input: { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            label="VAT"
                            disabled={createNewProductMutation.isPending}
                            value={values.vat}
                            onChange={(e) => setValue('vat', e.target.value)}
                            error={!!errors.vat}
                            helperText={errors.vat || helpers.vat}
                            fullWidth
                            margin="normal"
                            type='number'
                            slotProps={{
                                htmlInput: { min: 0, step: "0.25", max: 100 },
                                input: { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            label="PROFIT"
                            disabled={createNewProductMutation.isPending}
                            value={values.profit}
                            onChange={(e) => setValue('profit', e.target.value)}
                            error={!!errors.profit}
                            helperText={errors.profit || helpers.profit}
                            fullWidth
                            margin="normal"
                            type='number'
                            slotProps={{
                                htmlInput: { min: 0, step: "0.25", max: 100 },
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
                                label="Inventory Item"
                                labelPlacement="start"
                                sx={{ justifyContent: 'space-between', m: 1, alignItems: 'center', p: 0 }}
                            />
                            <FormHelperText>{errors.inventoryItem || helpers.inventoryItem}</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth margin="normal" error={!!errors.tags}>
                            <Typography mb={-1} variant="subtitle1">Tags</Typography>
                            <Button variant="outlined" onClick={() => setDialogOpen(true)} sx={{ mt: 1 }}>
                                Select Tags
                            </Button>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                {values.tags.map((tag) => (
                                    <Chip
                                        disabled={createNewProductMutation.isPending}
                                        key={tag.epc}
                                        label={tag.epc}
                                    />
                                ))}
                            </Box>
                            <FormHelperText>{errors.tags || helpers.tags}</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth margin="normal" error={!!errors.photos}>
                            <Typography variant="subtitle1">Photos</Typography>
                            <Input id="photos-upload" style={{ display: 'none' }} type="file" inputProps={{ multiple: true, accept: 'image/*' }} onChange={handleFileChange} />
                            <label htmlFor="photos-upload">
                                <Button
                                    disabled={createNewProductMutation.isPending}
                                    fullWidth
                                    variant="outlined"
                                    component="span"
                                    startIcon={<AddPhotoAlternate />}
                                >
                                    Upload Photos
                                </Button>
                            </label>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                                {previewUrls.map((url, idx) => (
                                    <img key={idx} src={url} alt={`preview ${idx}`} style={{ width: 100, height: 100, objectFit: 'cover' }} />
                                ))}
                            </Box>
                            <FormHelperText>{errors.photos || helpers.photos}</FormHelperText>
                        </FormControl>
                    </Grid>
                </Grid>
                <Button type="submit" variant="contained" disabled={createNewProductMutation.isPending} fullWidth sx={{ mt: 3 }}>
                    {createNewProductMutation.isPending ? <CircularProgress size={24} /> : 'Register Product'}
                </Button>
            </form>
            <SelectTags
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onConfirm={handleTagConfirm}
                selectedTags={values.tags}
            />
        </Paper>
    );
};

export default ProductRegistration;