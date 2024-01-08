$(document).ready(function () {
    // Check for webcam support
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        initializeWebcam();
    } else {
        alert('Webcam not supported on this browser');
    }
});

async function initializeWebcam() {
    const video = document.getElementById('webcam');
    const outputCanvas = document.getElementById('outputCanvas');

    // Get user media from webcam
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;

    // Load the face-api.js models
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');

    // Detect faces in real-time
    video.addEventListener('play', async () => {
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(outputCanvas, displaySize);

        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptors();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            faceapi.draw.drawDetections(outputCanvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(outputCanvas, resizedDetections);
        }, 100);
    });
}
