// Configuration
const CONFIG = {
  API_URL: 'http://localhost:3000/api/iot/log',
  DEVICE_ID: 'DEVICE_ABC123', // Set from registration
  SEND_INTERVAL: 5000 // Send data every 5 seconds
};

// Simulated sensor readings (replace with real sensor data)
class SensorSimulator {
  constructor() {
    this.heartbeat = 70;
    this.movement = true;
    this.jerkyMovement = false;
  }

  // Get heartbeat from wearable
  getHeartbeat() {
    // Replace with actual wearable API
    return this.heartbeat + Math.random() * 10 - 5;
  }

  // Get movement data
  getMovement() {
    // Replace with accelerometer data
    return Math.random() > 0.3;
  }

  // Detect jerky movements
  getJerkyMovement() {
    // Replace with accelerometer spike detection
    return Math.random() > 0.95;
  }

  // Get GPS location
  async getLocation() {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          position => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          error => reject(error)
        );
      } else {
        reject(new Error('Geolocation not available'));
      }
    });
  }
}

// Main IoT Client
class IotClient {
  constructor() {
    this.sensor = new SensorSimulator();
    this.isRunning = false;
  }

  async start() {
    console.log('🚀 IoT Device Client Started');
    console.log(`📱 Device ID: ${CONFIG.DEVICE_ID}`);

    this.isRunning = true;
    while (this.isRunning) {
      await this.sendData();
      await this.sleep(CONFIG.SEND_INTERVAL);
    }
  }

  stop() {
    this.isRunning = false;
    console.log('🛑 IoT Device Client Stopped');
  }

  async sendData() {
    try {
      const location = await this.sensor.getLocation();
      const payload = {
        deviceId: CONFIG.DEVICE_ID,
        heartbeat: Math.round(this.sensor.getHeartbeat()),
        movement: this.sensor.getMovement(),
        jerkyMovement: this.sensor.getJerkyMovement(),
        latitude: location.latitude,
        longitude: location.longitude
      };

      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      // Log response
      console.log(`📊 Data sent at ${new Date().toLocaleTimeString()}`);
      console.log(`❤️ Heartbeat: ${payload.heartbeat}`);
      console.log(`🏃 Movement: ${payload.movement}`);
      console.log(`⚡ Jerky: ${payload.jerkyMovement}`);

      // Check for emergency
      if (data.emergency || data.status === 'emergency_triggered') {
        this.handleEmergency(data.emergency);
      }
    } catch (error) {
      console.error('❌ Error sending data:', error);
    }
  }

  handleEmergency(emergencyData) {
    console.warn('🚨 EMERGENCY ALERT!');
    console.warn('Hospital:', emergencyData.hospital);
    console.warn('Phone:', emergencyData.hospital_phone);
    console.warn('Distance:', emergencyData.distance_km, 'km');

    // Play alarm
    this.playAlarm();

    // Send notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 Emergency Detected!', {
        body: `${emergencyData.hospital} has been notified. Help is on the way!`,
        icon: '/hospital-icon.png'
      });
    }
  }

  playAlarm() {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 1000; // 1000 Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 1
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize
const iotClient = new IotClient();

// Start on button click or page load
window.addEventListener('load', () => {
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // You can start automatically or on button click
  // iotClient.start();
});

// Expose to window for control
window.iotDevice = {
  start: () => iotClient.start(),
  stop: () => iotClient.stop()
};

console.log('IoT Device Client Ready');
console.log('Use: window.iotDevice.start() to begin monitoring');