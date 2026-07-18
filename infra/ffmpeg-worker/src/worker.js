const express = require('express');
const amqp = require('amqplib');

const app = express();
const PORT = process.env.PORT || 3010;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const ENCODING_QUEUE = 'video-encoding';

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ffmpeg-worker' });
});

// Connect to RabbitMQ and consume encoding jobs
async function startWorker() {
  try {
    console.log('Connecting to RabbitMQ...');
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(ENCODING_QUEUE, { durable: true });
    console.log(`Waiting for messages in queue: ${ENCODING_QUEUE}`);

    channel.consume(ENCODING_QUEUE, async (msg) => {
      if (msg) {
        try {
          const job = JSON.parse(msg.content.toString());
          console.log(`Received encoding job for video: ${job.videoId}`);

          // In production, this would:
          // 1. Download video from originalUrl
          // 2. Use FFmpeg to encode to multiple qualities
          // 3. Upload encoded segments to storage
          // 4. Update encoding status in database
          // 5. Notify backend when complete

          // For now, we'll just acknowledge the message
          // The actual encoding is handled by the backend encoding consumer
          console.log(`Processing encoding job: ${job.videoId}`);
          
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing job:', error);
          channel.nack(msg, false, false);
        }
      }
    }, { noAck: false });

    console.log('FFmpeg worker started and listening for jobs');
  } catch (error) {
    console.error('Failed to start worker:', error);
    process.exit(1);
  }
}

// Start Express server
app.listen(PORT, () => {
  console.log(`FFmpeg worker health check server running on port ${PORT}`);
});

// Start RabbitMQ consumer
startWorker();
