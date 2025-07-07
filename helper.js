'use strict';

function round(base) {
    return base.toFixed(3);
}

function getPixelColor(canvas, x, y) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const data = ctx.getImageData(x, y, 1, 1).data;
    return data;
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // To avoid CORS issues
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

function circularVignetteFade(canvas, color) {
    const UNTOUCHED_RADIUS_RATIO = 0.3;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const [rFade, gFade, bFade] = color;

    const cx = width / 2;
    const cy = height / 2;

    const maxDist = Math.sqrt(cx * cx + cy * cy);
    const untouchedRadius = Math.min(width, height) * UNTOUCHED_RADIUS_RATIO;
    const fadeStartRadius = Math.min(width, height) * 0.5;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;

            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= untouchedRadius) {
                // Do nothing, keep original color
                continue;
            }

            if (dist >= fadeStartRadius) {
                // Fully outside: hard replace with fade color
                data[index]     = rFade;
                data[index + 1] = gFade;
                data[index + 2] = bFade;
                continue;
            }

            // In the gradient zone: blend
            const factor = (dist - untouchedRadius) / (fadeStartRadius - untouchedRadius);

            data[index]     = data[index] * (1 - factor) + rFade * factor;
            data[index + 1] = data[index + 1] * (1 - factor) + gFade * factor;
            data[index + 2] = data[index + 2] * (1 - factor) + bFade * factor;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}
