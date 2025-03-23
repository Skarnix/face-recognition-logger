let registeredDescriptors = [];

async function setupCamera() {
    const video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
}

async function loadModels() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('models');
}

async function registerFace() {
    const video = document.getElementById('video');
    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
    if (detections) {
        registeredDescriptors.push({ descriptor: detections.descriptor, timestamp: new Date().toISOString() });
        alert('Face registered successfully!');
    } else {
        alert('No face detected. Try again!');
    }
}

async function recognizeFaces() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    setInterval(async () => {
        const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
        if (detections) {
            const match = findMatch(detections.descriptor);
            if (match) {
                logToGoogleSheet(match.timestamp);
            }
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, detections);
    }, 3000);
}

function findMatch(descriptor) {
    for (let regFace of registeredDescriptors) {
        const distance = faceapi.euclideanDistance(descriptor, regFace.descriptor);
        if (distance < 0.6) {  // Threshold for a match
            return regFace;
        }
    }
    return null;
}

function logToGoogleSheet(timestamp) {
    fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp })
    }).then(response => response.json())
      .then(data => console.log('Logged:', data))
      .catch(error => console.error('Error:', error));
}

setupCamera();
loadModels().then(() => recognizeFaces());
