const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const saveButton = document.getElementById('save');

upload.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            processImage(img);
        };
    }
});

async function processImage(img) {
    // Set canvas size to image size
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);

    // Convert the image to grayscale
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

    // Apply GaussianBlur
    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

    // Detect edges
    const edges = new cv.Mat();
    cv.Canny(blurred, edges, 75, 200);

    // Find contours
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    // Find the largest contour which is assumed to be the document
    let maxArea = 0;
    let largestContour = null;
    for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        if (area > maxArea) {
            maxArea = area;
            largestContour = contour;
        }
    }

    // Draw the largest contour
    if (largestContour) {
        const boundingRect = cv.boundingRect(largestContour);

        // Draw red box on the original image
        context.strokeStyle = 'red';
        context.lineWidth = 2;
        context.strokeRect(boundingRect.x, boundingRect.y, boundingRect.width, boundingRect.height);

        // Crop the image
        const cropped = src.roi(boundingRect);
        cv.imshow(canvas, cropped);
        cropped.delete();

        saveButton.hidden = false;
    }

    // Clean up
    src.delete();
    gray.delete();
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
}

saveButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'cropped-image.png';
    link.href = canvas.toDataURL();
    link.click();
});
