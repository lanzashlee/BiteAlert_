import React, { useState } from 'react';
import { apiFetch } from '../../config/api';

const ActivateAccount = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [msg, setMsg] = useState('');

  const sendOtp = async () => {
    setMsg('Sending OTP...');
    try {
      const res = await apiFetch('/api/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      setMsg(data.success ? 'OTP sent!' : (data.message || 'Failed to send OTP'));
    } catch (e) {
      setMsg('Error sending OTP');
    }
  };

  const activate = async () => {
    setMsg('Activating...');
    try {
      const res = await apiFetch('/api/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp, newPassword: 'TempPass123!' }) });
      const data = await res.json();
      setMsg(data.success ? 'Activated! Please change your password.' : (data.message || 'Activation failed'));
    } catch (e) {
      setMsg('Error activating');
    }
  };

  return (
    <div className="container" style={{ paddingTop: 100 }}>
      <h1>Activate Account</h1>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={sendOtp}>Send OTP</button>
        <button onClick={activate}>Activate</button>
      </div>
      <p>{msg}</p>
    </div>
  );
};

export default ActivateAccount;

 