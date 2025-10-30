import React, { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    FormHelperText,
    InputLabel,
    LinearProgress,
    Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { apiUpload } from '../../lib/api';

interface UploadResponse {
    // Define your expected response shape here, e.g., { success: boolean; message: string; fileId?: string }
    success: boolean;
    message: string;
}

const DBRestore: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('backupZipFile', file);

            return apiUpload<UploadResponse>(
                '/api/db-operations/restore-backup',
                formData,
                (percent, loaded, total) => {
                    setProgress(percent);
                    // Optional: Log loaded/total for debugging
                    console.log(`Uploaded ${loaded} of ${total} bytes (${percent}%)`);
                },
                'POST' // Or 'PUT' if needed
            );
        },
        onMutate: () => {
            setIsUploading(true);
            setProgress(0);
        },
        onSuccess: (data) => {
            console.log('Upload successful:', data);
            // Optional: Show success message or reset form
            alert(data.message || 'Upload completed!');
            setSelectedFile(null);
            setProgress(0);
        },
        onError: (error) => {
            console.error('Upload failed:', error);
            // Optional: Show error message
            alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        },
        onSettled: () => {
            setIsUploading(false);
        },
    });

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
        if (selectedFile) {
            uploadMutation.mutate(selectedFile);
        }
    }, [selectedFile, uploadMutation]);

    const fileSizeInMB = selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0;

    return (
        <Box sx={{ maxWidth: 1, mx: 'auto', mt: 4 }}>
            <Card elevation={3}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h5" component="h2" gutterBottom align="center" color="primary">
                        Zip File Upload
                    </Typography>

                    <FormControl fullWidth disabled={isUploading} sx={{ mb: 2 }}>
                        <InputLabel htmlFor="fileInput" />
                        <input
                            id="fileInput"
                            type="file"
                            accept=".zip"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        <Button
                            variant="outlined"
                            component="label"
                            htmlFor="fileInput"
                            startIcon={<CloudUploadIcon />}
                            fullWidth
                            disabled={isUploading}
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
                            disabled={isUploading || uploadMutation.isPending}
                            fullWidth
                            startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                            sx={{ mb: 2 }}
                        >
                            {isUploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    )}

                    {isUploading && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" gutterBottom>
                                Upload Progress: {progress}%
                            </Typography>
                            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
                        </Box>
                    )}

                    {uploadMutation.isError && (
                        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                            Error: {uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Upload failed'}
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default DBRestore;