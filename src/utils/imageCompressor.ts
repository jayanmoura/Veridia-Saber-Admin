/**
 * Compresses an image using the Canvas API.
 * Always converts to JPEG to maximize compression.
 * If the image is already narrower than maxWidth, only the quality compression is applied.
 *
 * @param file     - Original image file (any browser-supported format)
 * @param maxWidth - Maximum width in pixels (default 1200)
 * @param quality  - JPEG quality 0–1 (default 0.85)
 * @returns A new File with `thumb_` prefix and `.jpg` extension
 */
export function compressImage(file: File, maxWidth = 1200, quality = 0.85): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            let { width, height } = img;
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas 2D context unavailable'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('toBlob returned null'));
                        return;
                    }
                    const baseName = file.name.replace(/\.[^.]+$/, '.jpg');
                    const thumbFile = new File([blob], `thumb_${baseName}`, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    resolve(thumbFile);
                },
                'image/jpeg',
                quality,
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image for compression'));
        };

        img.src = objectUrl;
    });
}

/**
 * Generates a micro-thumbnail for use in table listings.
 * 300px wide, 70% quality — optimised for minimal bandwidth in data-dense views.
 *
 * @param file - Original image file
 * @returns A new File with `thumb_` prefix and `.jpg` extension at 300px
 */
export function compressForListing(file: File): Promise<File> {
    return compressImage(file, 300, 0.70);
}
