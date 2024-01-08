const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

let videoStream = null;
let ffmpegProcess;

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle video data from the client
  socket.on('videoData', (data) => {
    // Process the video data as needed
    console.log('Received video data');

    // Save video data to a file (e.g., video_frames.raw)
    if (videoStream) {
      const videoBuffer = Buffer.from(data.data, 'base64');
      videoStream.write(videoBuffer);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Create a writable stream for video frames
videoStream = fs.createWriteStream('video_frames.mp4');

// When the server is closed, finalize the video and save it as video.mp4
server.on('close', () => {
  if (ffmpegProcess) {
    // Stop the ffmpeg process if it's still running
    ffmpegProcess.stdin.write('q');
    ffmpegProcess.stdin.end();
  }

  videoStream.end();
  console.log('Server is closing. Finalizing the video...');

  // Convert raw video frames to video.mp4 using ffmpeg
  ffmpegProcess = spawn('ffmpeg', [
    '-f', 'rawvideo',
    '-pix_fmt', 'yuv420p',
    '-s', '640x480', // Adjust the resolution if needed
    '-i', 'video_frames.raw',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    'video.mp4'
  ]);

  ffmpegProcess.on('close', (code) => {
    console.log(`ffmpeg process exited with code ${code}`);
  });
});
