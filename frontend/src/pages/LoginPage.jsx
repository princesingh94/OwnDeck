import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl glass-card p-8 shadow-neon">
      <h1 className="mb-1 text-3xl font-bold">Welcome Back</h1>
      <p className="mb-6 text-sm text-slate-600">Sign in to manage your product warranties.</p>
      {error && <p className="mb-4 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full rounded-lg border p-3" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="w-full rounded-lg border p-3" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <button className="w-full rounded-lg bg-coral px-4 py-3 font-semibold text-white">Login</button>
      </form>
      <p className="mt-4 text-sm">No account? <Link to="/signup" className="font-semibold text-teal">Create one</Link></p>
    </div>
  );
};

export default LoginPage;
