import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await signup(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl glass-card p-8 shadow-neon">
      <h1 className="mb-1 text-3xl font-bold">Create Account</h1>
      <p className="mb-6 text-sm text-slate-600">Start your lifetime warranty tracking.</p>
      {error && <p className="mb-4 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full rounded-lg border p-3" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="w-full rounded-lg border p-3" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="w-full rounded-lg border p-3" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="w-full rounded-lg border p-3" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <button className="w-full rounded-lg bg-coral px-4 py-3 font-semibold text-white">Sign Up</button>
      </form>
      <p className="mt-4 text-sm">Already have account? <Link to="/login" className="font-semibold text-teal">Login</Link></p>
    </div>
  );
};

export default SignupPage;
