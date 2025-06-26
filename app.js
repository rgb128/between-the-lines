'use strict';

// const ZOOM_STEP = .1;

// const canvas = document.getElementById('chessboard');
// const ctx = canvas.getContext('2d');
// const size = 200;
// const squares = 8;
// const squareSize = size / squares;

// for (let row = 0; row < squares; row++) {
//     for (let col = 0; col < squares; col++) {
//         if ((row + col) % 2 === 0) {
//             ctx.fillStyle = '#fff'; // white square
//         } else {
//             ctx.fillStyle = '#000'; // black square
//         }
//         ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
//     }
// }

const canvas = document.getElementById('chessboard');
const ctx = canvas.getContext('2d');
const size = 200;
const squares = 8;
const squareSize = size / squares;

// Draw the chessboard
for (let row = 0; row < squares; row++) {
    for (let col = 0; col < squares; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#fff' : '#000';
        ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
    }
}

let scale = 1;
let offsetX = 0;
let offsetY = 0;

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Update scale
    const newScale = scale * 1.2;

    // Adjust offsets to zoom around the click point
    offsetX = x * (1 - 1.2) + offsetX * 1.2;
    offsetY = y * (1 - 1.2) + offsetY * 1.2;

    scale = newScale;

    canvas.style.transform = `scale(${scale}) translate(${offsetX / scale / 2}px, ${offsetY / scale / 2 }px)`;
});
