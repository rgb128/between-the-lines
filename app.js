'use strict';


// const generateImageUrl = () => `https://random.imagecdn.app/${WIDTH}/${HEIGHT}?random=${Math.random()}`;
const SIZE = 1000;
const IMAGES_QUEUE_SIZE = 3;
const FIRST_IMAGE_URL = '/between-the-lines/first.jpg';
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

window.onresize = _ => {
    const zoomX = window.innerWidth / WIDTH;
    const zoomY = window.innerHeight / HEIGHT;

    const zoom = Math.max(zoomX, zoomY);

    const x = (window.innerWidth - WIDTH * zoom) / 2;
    const y = (window.innerHeight - HEIGHT * zoom) / 2;

    container.style.left = round(x) + 'px';
    container.style.top = round(y) + 'px';
    container.style.transform = `scale(${zoom})`;
}

window.onresize();

container.onclick = e => {
    if (!animationAvailable || !images.length) return;
    animationAvailable = false;
    const rect = container.getBoundingClientRect();

    // Get mouse position relative to the container, normalized by the transform scale
    const scaleX = rect.width / WIDTH;
    const scaleY = rect.height / HEIGHT;

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const clickX = rawX / scaleX;
    const clickY = rawY / scaleY;

    // Apply zoom
    const imageZoom = SIZE;

    // New position should keep the image point under cursor stationary
    const imagePositionX = clickX - clickX * imageZoom;
    const imagePositionY = clickY - clickY * imageZoom;

    const transformZoom = round(100 * imageZoom) + '%';
    // const translateX = round(imagePositionX) + 'px';
    // const translateY = round(imagePositionY) + 'px';

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
    newCanvas.style.transform = `translate(${round(clickX)}px, ${round(clickY)}px) scale(${round(1 / imageZoom)})`;
    container.appendChild(newCanvas);
    void newCanvas.offsetWidth; // Force reflow
    
    newCanvas.style.transform = `translate(0px, 0px) scale(1)`;
    // oldCanvas.style.left = translateX;
    // oldCanvas.style.top = translateY;
    // console.log(translateX, translateY);
    // oldCanvas.style.transform = `scale(${transformZoom})`;
    // oldCanvas.style.transform = `translate(${translateX}, ${translateY}) scale(${transformZoom})`;
    // oldCanvas.style.transform = `translate(${translateX}, ${translateY})`;
    oldCanvas.style.transformOrigin = `${clickX}px ${clickY}px`;
    oldCanvas.style.transform = `scale(${transformZoom})`;
    newCanvas.style.opacity = 1;
    // void newCanvas.offsetWidth; // Force reflow

    // After animation, replace .old with .new
    newCanvas.addEventListener('transitionend', () => {
        oldCanvas.remove();
        newCanvas.classList.remove('new');
        newCanvas.classList.add('old');
        animationAvailable = true;
    }, { once: true });

};



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


main();
