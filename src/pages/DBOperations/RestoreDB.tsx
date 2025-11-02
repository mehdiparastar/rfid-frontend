import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    FormHelperText,
    Grid,
    InputLabel,
    LinearProgress,
    Typography,
} from '@mui/material';
import React, { useCallback, useRef, useState } from 'react';
import { useRestoreBackup } from '../../api/dbOperation';
import { useRestoreProgress } from '../../features/useRestoreProgressLive';

const DBRestore: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingProgress, setUploadingProgress] = useState<number>(0);

    const { mutate: uploadMutation, isPending: isUploadPending, isError: isUploadError, error: uploadError } = useRestoreBackup();
    const { restoreDBProgress, restoreFilesProgress, isComplete, resetProgress } = useRestoreProgress()

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.name.endsWith('.zip')) {
            setSelectedFile(file);
        } else {
            alert('Please select a valid .zip file.');
            event.target.value = ''; // Clear invalid selection
        }
    }, []);

    const handleUpload = useCallback(() => {
        resetProgress()
        try {
            if (selectedFile) {
                setUploadingProgress(0);
                uploadMutation(
                    { file: selectedFile, onProgress: setUploadingProgress },
                    {
                        onSuccess: (data) => {
                            console.log('Upload successful:', data);
                            // Optional: Show success message or reset form
                            alert(data.message || 'Upload completed!');
                            setSelectedFile(null);
                            setUploadingProgress(0);
                        },
                        onError: (error) => {
                            console.error('Upload failed:', error);
                            // Optional: Show error message
                            alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            setUploadingProgress(0);
                        },
                        onSettled: () => {
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                            }
                            setUploadingProgress(0);
                        },
                    }
                );
            }
        }
        catch (error) {
            console.error("Restore failed:", error);
            resetProgress();
        }
    }, [selectedFile, uploadMutation]);

    const fileSizeInMB = selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0;

    // Calculate a combined progress for button display (e.g., average)
    const combinedProgress = Math.round((restoreDBProgress + restoreFilesProgress) / 2);
    const isInProgress = (isUploadPending && combinedProgress < 100) || isUploadPending;

    return (
        <Box sx={{ maxWidth: 1, mx: 'auto', mt: 4 }}>
            <Card elevation={3}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h5" component="h2" gutterBottom align="center" color="primary">
                        Backup File Upload
                    </Typography>

                    <FormControl fullWidth disabled={isUploadPending} sx={{ mb: 2 }}>
                        <InputLabel htmlFor="fileInput" />
                        <Box
                            ref={fileInputRef}
                            component={'input'}
                            id="fileInput"
                            type="file"
                            accept=".zip"
                            onChange={handleFileSelect}
                            sx={{ display: 'none' }}
                        />
                        <Button
                            variant="outlined"
                            component="label"
                            htmlFor="fileInput"
                            startIcon={<CloudUploadIcon />}
                            fullWidth
                            disabled={isUploadPending}
                            sx={{ textTransform: 'none' }}
                        >
                            Choose File
                        </Button>
                        {selectedFile && (
                            <FormHelperText variant='outlined' sx={{ mt: 1, color: "success.main" }}>
                                Selected: {selectedFile.name} ({fileSizeInMB} MB)
                            </FormHelperText>
                        )}
                    </FormControl>

                    {selectedFile && (
                        <Button
                            variant="contained"
                            onClick={handleUpload}
                            disabled={isInProgress || isUploadPending}
                            fullWidth
                            startIcon={isUploadPending ? <CircularProgress size={20} color="inherit" /> : isInProgress ? <CircularProgress size={24} /> : <CloudUploadIcon />}
                            sx={{ mb: 2 }}
                        >
                            {(isInProgress || isUploadPending) ? 'Uploading...' : 'Upload'}
                        </Button>
                    )}

                    {isUploadPending && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" gutterBottom>
                                Upload Progress: {uploadingProgress}%
                            </Typography>
                            <LinearProgress variant="determinate" value={uploadingProgress} sx={{ height: 8, borderRadius: 4 }} />
                        </Box>
                    )}
                    {isInProgress && (
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" gutterBottom>
                                    DB Restore: {restoreDBProgress}%
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={restoreDBProgress}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" gutterBottom>
                                    Files Restore": {restoreFilesProgress}%
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={restoreFilesProgress}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                            </Grid>
                            {isComplete && (
                                <Grid size={{ xs: 12 }}>
                                    <Typography color="success.main" variant="body1">
                                        Restore complete! Download ready.
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                    )}

                    {isUploadError && (
                        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                            Error: {uploadError instanceof Error ? uploadError.message : 'Upload failed'}
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default DBRestore;