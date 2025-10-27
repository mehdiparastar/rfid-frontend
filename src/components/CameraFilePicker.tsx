import { Close, PhotoCamera } from '@mui/icons-material';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Typography,
    useTheme,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { translate } from '../utils/translate';
import { generatePreview } from '../utils/imageUtils';

export interface CapturedFile {
    file: File,
    previewUrl?: string;
    preview?: File
}

interface CameraFilePickerProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (captured: CapturedFile[]) => void;
    initialFiles?: File[];
}

const CameraFilePicker: React.FC<CameraFilePickerProps> = ({
    open,
    onClose,
    onConfirm,
    initialFiles = [],
}) => {
    const theme = useTheme();
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)!
    const videoRef = useRef<HTMLVideoElement>(null);
    const [capturedFiles, setCapturedFiles] = useState<CapturedFile[]>([]);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    useEffect(() => {
        if (open) {
            setConfirmed(false);
            const generatePreviews = async () => {
                const filesWithPreviews = await Promise.all(
                    initialFiles.map(async (file) => ({
                        file,
                        preview: await generatePreview(file),
                        previewUrl: URL.createObjectURL(file)
                    } as CapturedFile))
                );
                setCapturedFiles(filesWithPreviews);
            };
            // setCapturedFiles(initialFiles.map(async (file) => ({ ...file, preview: await generatePreview(file) /*previewUrl: URL.createObjectURL(file) */ } as CapturedFile)));
            generatePreviews();
            startCamera();
        } else {
            setCapturedFiles([]);
            stopCamera();
        }

        return () => {
            stopCamera();
            if (!confirmed) {
                capturedFiles.forEach(file => {
                    if (file.previewUrl) {
                        URL.revokeObjectURL(file.previewUrl);
                    }
                });
            }
        };
    }, [open, initialFiles]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Prefer back camera on mobile; fallback to user-facing on desktop
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            // Optionally show an alert or error message here
            onClose();
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || isCapturing) return;

        setIsCapturing(true);
        const canvas = document.createElement('canvas');
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
                async (blob) => {
                    if (blob) {
                        const timestamp = Date.now();
                        const buffer = await blob.arrayBuffer();
                        const file_ = new File([blob], `captured-photo-${timestamp}.jpg`, {
                            type: 'image/jpeg',
                        });
                        const file = new File([buffer], `captured-photo-${timestamp}.jpg`, {
                            type: 'image/jpeg',
                        });
                        const fileWithPreview = {
                            file,
                            previewUrl: URL.createObjectURL(file),
                            preview: await generatePreview(file)
                        };
                        setCapturedFiles(prev => [...prev, fileWithPreview]);
                    }
                    setIsCapturing(false);
                },
                'image/jpeg',
                0.8 // Quality
            );
        } else {
            setIsCapturing(false);
        }
    };

    const removeCapturedFile = (index: number) => {
        const fileToRemove = capturedFiles[index];
        if (fileToRemove.previewUrl) {
            URL.revokeObjectURL(fileToRemove.previewUrl);
        }
        setCapturedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleConfirm = () => {
        onConfirm(capturedFiles);
        setConfirmed(true);
        onClose();
    };



    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {t['Capture Photos']}
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Paper elevation={2} sx={{ position: 'relative', mb: 2 }}>
                    <video
                        ref={videoRef}
                        style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            backgroundColor: '#000',
                        }}
                        playsInline
                    />
                    <IconButton
                        onClick={capturePhoto}
                        disabled={isCapturing}
                        sx={{
                            position: 'absolute',
                            bottom: 16,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' },
                        }}
                    >
                        <PhotoCamera sx={{ color: '#000' }} />
                    </IconButton>
                </Paper>
                {capturedFiles.length > 0 && (
                    <>
                        <Typography variant="subtitle1" gutterBottom>
                            {t['Captured Photos']} ({capturedFiles.length})
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px',
                                justifyContent: 'center',
                            }}
                        >
                            {capturedFiles.map((file, index) => (
                                <Paper
                                    key={index}
                                    elevation={1}
                                    sx={{ position: 'relative', width: 100, height: 100 }}
                                >
                                    <Box
                                        component={'img'}
                                        src={file.previewUrl}
                                        alt={`Captured ${index + 1}`}
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={() => removeCapturedFile(index)}
                                        sx={{
                                            position: 'absolute',
                                            top: -8,
                                            right: -8,
                                            backgroundColor: 'white',
                                            color: 'red',
                                        }}
                                    >
                                        <Close fontSize="small" />
                                    </IconButton>
                                </Paper>
                            ))}
                        </Box>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined">
                    {t['Cancel']}
                </Button>
                <Button onClick={handleConfirm} variant="contained" disabled={capturedFiles.length === 0}>
                    {t['Confirm']} ({capturedFiles.length})
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CameraFilePicker;