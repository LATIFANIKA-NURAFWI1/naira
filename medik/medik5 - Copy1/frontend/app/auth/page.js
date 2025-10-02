"use client";
import { useState } from 'react';
import { api } from '../../lib/api';
import { setToken } from '../../lib/auth';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode==='register') {
        await api('/api/register', { method: 'POST', body: form });
      }
      const res = await api('/api/login', { method: 'POST', body: { email: form.email, password: form.password } });
      setToken(res.token);
      alert('Masuk berhasil!');
    } catch (e) {
      alert('Gagal: ' + e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="fade-in">
      <h1 className="text-3xl font-bold text-primary-dark text-center">{mode==='login'? 'Masuk' : 'Daftar'}</h1>
      <div className="card p-6 mt-6 max-w-md mx-auto">
        <form onSubmit={submit} className="grid gap-3">
          {mode==='register' && (
            <div>
              <label className="text-sm text-gray-600">Nama</label>
              <input className="w-full px-3 py-2" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required={mode==='register'} />
            </div>
          )}
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input type="email" className="w-full px-3 py-2" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
          </div>
          <div>
            <label className="text-sm text-gray-600">Password</label>
            <input type="password" className="w-full px-3 py-2" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
          </div>
          <button disabled={loading} className="btn-primary mt-2">{loading? 'Memproses...' : (mode==='login'? 'Masuk' : 'Daftar')}</button>
        </form>
        <button onClick={()=> setMode(mode==='login'?'register':'login')} className="text-sm text-primary-dark mt-3">
          {mode==='login'? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
        </button>
      </div>
    </div>
  );
}
