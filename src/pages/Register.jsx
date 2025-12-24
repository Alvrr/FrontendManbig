import React, { useState } from "react";
import { registerService } from "../services/authAPI";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";

export default function RegisterPage() {
  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    role: "admin"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerService(form);
      await Swal.fire({
        icon: "success",
        title: "Registrasi berhasil",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        },
        buttonsStyling: false
      });
      navigate("/login"); // redirect ke login setelah register
    } catch (err) {
      setError(err.message || "Registrasi gagal");
      await Swal.fire({
        icon: "error",
        title: "Registrasi gagal",
        text: err.message || "Registrasi gagal",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        },
        buttonsStyling: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -left-10 top-16 h-80 w-2 bg-white/10 rounded-full" />
        <div className="absolute left-4 top-36 h-64 w-2 bg-white/10 rounded-full" />
        <div className="absolute right-10 -top-10 h-60 w-60 rounded-full bg-gradient-to-tr from-sky-400/20 via-blue-400/10 to-transparent blur-2xl" />
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        {error && <div className="mb-4 rounded-md bg-red-600/30 border border-red-300 px-4 py-2 text-white">{error}</div>}
        <div className="mb-4">
          <label className="block mb-1">Nama</label>
          <input
            type="text"
            name="nama"
            className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={form.nama}
            onChange={handleChange}
            placeholder="Contoh: John Doe"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input
            type="email"
            name="email"
            className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={form.email}
            onChange={handleChange}
            placeholder="Contoh: john.doe@email.com"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Password</label>
          <input
            type="password"
            name="password"
            className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={form.password}
            onChange={handleChange}
            placeholder="Minimal 6 karakter"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1">Role</label>
          <select
            name="role"
            className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={form.role}
            onChange={handleChange}
          >
            <option value="admin">Admin</option>
            <option value="kasir">Kasir</option>
            <option value="gudang">Gudang</option>
            <option value="driver">Driver</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full rounded-full px-4 py-3 text-sm font-bold text-white shadow-xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 hover:opacity-95 transition"
          disabled={loading}
        >
          {loading ? "Loading..." : "Register"}
        </button>
        <div className="mt-4 text-center">
          <span className="text-white/80">Sudah punya akun? </span>
          <Link to="/login" className="text-sky-400 hover:underline">Login</Link>
        </div>
      </form>
    </div>
  );
}