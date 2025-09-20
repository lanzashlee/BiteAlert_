import React, { useState } from 'react';

const CreateAccount = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    birthdate: '',
    password: '',
    role: 'admin'
  });
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMsg('Creating...');
    try {
      const res = await fetch('/api/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      setMsg(data.success ? 'Account created!' : (data.message || 'Failed'));
    } catch (e) {
      setMsg('Error creating account');
    }
  };

  return (
    <div className="container" style={{ paddingTop: 100 }}>
      <h1>Create Account</h1>
      <form onSubmit={submit}>
        {Object.keys(form).map((key) => (
          <div key={key} style={{ marginBottom: 8 }}>
            <input
              placeholder={key}
              type={key === 'password' ? 'password' : key === 'birthdate' ? 'date' : 'text'}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </div>
        ))}
        <button type="submit">Create</button>
      </form>
      <p>{msg}</p>
    </div>
  );
};

export default CreateAccount;

 