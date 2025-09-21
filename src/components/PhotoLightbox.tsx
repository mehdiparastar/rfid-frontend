import { Dialog, Box, IconButton } from "@mui/material";
import { Close, ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { useState } from "react";

interface PhotoLightboxProps {
    photos: string[];
    open: boolean;
    initialIndex?: number;
    onClose: () => void;
}

export default function PhotoLightbox({ photos, open, initialIndex = 0, onClose }: PhotoLightboxProps) {
    const [currentIndex_, setCurrentIndex] = useState(initialIndex);

    if (!photos || photos.length === 0) return null;

    const prevPhoto = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));
    const nextPhoto = () => setCurrentIndex((prev) => Math.min(prev + 1, photos.length - 1));

    const currentIndex = currentIndex_ >= photos.length ? photos.length - 1 : currentIndex_

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg">
            <Box sx={{ position: "relative", bgcolor: "black" }}>
                <IconButton onClick={onClose} sx={{ position: "absolute", top: 8, right: 8, color: "white", zIndex: 10 }}>
                    <Close />
                </IconButton>

                <img
                    src={`api${photos[currentIndex]}`}
                    alt={`Photo ${currentIndex + 1}`}
                    style={{ width: "100%", maxHeight: "80vh", objectFit: "contain" }}
                />

                {currentIndex > 0 && (
                    <IconButton
                        onClick={prevPhoto}
                        sx={{ position: "absolute", top: "50%", left: 0, color: "white", zIndex: 10 }}
                    >
                        <ArrowBackIos />
                    </IconButton>
                )}

                {currentIndex < photos.length - 1 && (
                    <IconButton
                        onClick={nextPhoto}
                        sx={{ position: "absolute", top: "50%", right: 0, color: "white", zIndex: 10 }}
                    >
                        <ArrowForwardIos />
                    </IconButton>
                )}
            </Box>
        </Dialog>
    );
}
