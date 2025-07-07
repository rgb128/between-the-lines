'use strict';


// const generateImageUrl = () => `https://random.imagecdn.app/${WIDTH}/${HEIGHT}?random=${Math.random()}`;
const SIZE = 1000;
const IMAGES_QUEUE_SIZE = 5;
const FIRST_IMAGE_URL = '/first.png';
const generateImageUrl = () => `https://picsum.photos/${SIZE}?random=${Math.random()}`;

const images = [];
async function fillImages() {
    const img = await loadImage(FIRST_IMAGE_URL);
    images.push(img);

    const tasks = [];
    for (let i = 0; i < IMAGES_QUEUE_SIZE - 1; i++) {
        const url = generateImageUrl();
        const task = loadImage(url);
        tasks.push(task);
    }
    const results = await Promise.all(tasks);
    images.push(...results);
}

const container = document.getElementById('container');
const WIDTH = SIZE;
const HEIGHT = SIZE;
const IMAGE_URL = generateImageUrl();
let animationAvailable = false;

container.style.width = WIDTH + 'px';
container.style.height = HEIGHT + 'px';

function round(base, dec) {
    return base.toFixed(3);
}

window.onresize = _ => {
    const zoomX = window.innerWidth / WIDTH;
    const zoomY = window.innerHeight / HEIGHT;

    const zoom = Math.max(zoomX, zoomY);

    const x = (window.innerWidth - WIDTH * zoom) / 2;
    const y = (window.innerHeight - HEIGHT * zoom) / 2;

    container.style.left = round(x, 2) + 'px';
    container.style.top = round(y, 2) + 'px';
    container.style.transform = `scale(${zoom})`;
}

window.onresize();

container.onclick = e => {
    if (!animationAvailable || !images.length) return;
    animationAvailable = false;
    const clickX = e.offsetX;
    const clickY = e.offsetY;

    // Apply zoom
    const imageZoom = SIZE;

    // New position should keep the image point under cursor stationary
    const imagePositionX = clickX - clickX * imageZoom;
    const imagePositionY = clickY - clickY * imageZoom;

    const transformZoom = round(100 * imageZoom, 2) + '%';
    const translateX = round(imagePositionX, 2) + 'px';
    const translateY = round(imagePositionY, 2) + 'px';

    const oldCanvas = container.querySelector('canvas.old');
    const pixelColor = getPixelColor(oldCanvas, clickX, clickY);

    // Create new canvas
    const newCanvas = document.createElement('canvas');
    newCanvas.width = WIDTH;
    newCanvas.height = HEIGHT;
    newCanvas.style.opacity = 0;
    newCanvas.classList.add('new');
    const newCtx = newCanvas.getContext('2d', { willReadFrequently: true });

    const img = images.shift();
    loadImage(generateImageUrl()).then(img => images.push(img));
    newCtx.drawImage(img, 0, 0, WIDTH, HEIGHT);
    circularVignetteFade(newCanvas, pixelColor);

    // Place new canvas scaled to 1px size and positioned at clicked pixel
    newCanvas.style.transform = `translate(${round(clickX, 2)}px, ${round(clickY, 2)}px) scale(${round(1 / imageZoom, 2)})`;
    container.appendChild(newCanvas);
    void newCanvas.offsetWidth; // Force reflow

    newCanvas.style.transform = `translate(0px, 0px) scale(1)`;
    oldCanvas.style.transform = `translate(${translateX}, ${translateY}) scale(${transformZoom})`;
    newCanvas.style.opacity = 1;

    // Trigger zoom to full size
    // requestAnimationFrame(() => {
    //     newCanvas.style.transform = `translate(0px, 0px) scale(1)`;
    //     oldCanvas.style.transform = `translate(${translateX}, ${translateY}) scale(${transformZoom})`;
    //     newCanvas.style.opacity = 1;
    // });

    // Trigger zoom to full size
    // we need 2 requests to make it work on mozilla for some reason
    // requestAnimationFrame(() => { 
    // //     container.appendChild(newCanvas);
    //     requestAnimationFrame(() => {
    //         newCanvas.style.transform = `translate(0px, 0px) scale(1)`;
    //         oldCanvas.style.transform = `translate(${translateX}, ${translateY}) scale(${transformZoom})`;
    //         newCanvas.style.opacity = 1;
    //     }); 
    // });

    // After animation, replace .old with .new
    newCanvas.addEventListener('transitionend', () => {
        oldCanvas.remove();
        newCanvas.classList.remove('new');
        newCanvas.classList.add('old');
        animationAvailable = true;
    }, { once: true });

};

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

async function main() {
    await fillImages();
    document.getElementById('loader').remove();

    const img = images.shift();
    loadImage(generateImageUrl()).then(img => images.push(img));

    // create old canvas
    const originalCanvas = document.createElement('canvas');
    originalCanvas.classList.add('old');
    originalCanvas.width = WIDTH;
    originalCanvas.height = HEIGHT;
    const oCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
    oCtx.drawImage(img, 0, 0, WIDTH, HEIGHT);
    container.appendChild(originalCanvas);
    animationAvailable = true;
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

main();
