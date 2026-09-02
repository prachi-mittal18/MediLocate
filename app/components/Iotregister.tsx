'use client';

import { useState } from 'react';

interface IotRegisterProps {
  onSuccess?: (userId: string) => void;
}

export default function IotRegister({ onSuccess }: IotRegisterProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    password: '',
    emergencyContact: '',
    iotDeviceId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/iot/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(true);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('deviceId', formData.iotDeviceId);

      if (onSuccess) {
        onSuccess(data.user.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="success-message">
        ✅ Registration successful! Your IoT device is now connected.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="iot-registration-form">
      <h2>Register with IoT Device</h2>

      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Full Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Phone</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>IoT Device ID (from your device)</label>
        <input
          type="text"
          name="iotDeviceId"
          value={formData.iotDeviceId}
          onChange={handleChange}
          placeholder="e.g., DEVICE_ABC123"
          required
        />
      </div>

      <div className="form-group">
        <label>Emergency Contact Number</label>
        <input
          type="tel"
          name="emergencyContact"
          value={formData.emergencyContact}
          onChange={handleChange}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register Device'}
      </button>
    </form>
  );
}