export async function generatePreview(file: File, maxWidth: number = 300, maxHeight: number = 300): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context not available'));
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Blob creation failed'));
                const previewFile = new File([blob], `preview_${file.name}`, { type: 'image/jpeg' });
                resolve(previewFile);
            }, 'image/jpeg', 0.8); // 80% quality for optimization
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}