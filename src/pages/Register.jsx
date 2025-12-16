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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <div className="mb-4">
          <label className="block mb-1">Nama</label>
          <input
            type="text"
            name="nama"
            className="w-full border px-3 py-2 rounded"
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
            className="w-full border px-3 py-2 rounded"
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
            className="w-full border px-3 py-2 rounded"
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
            className="w-full border px-3 py-2 rounded"
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
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
          disabled={loading}
        >
          {loading ? "Loading..." : "Register"}
        </button>
        <div className="mt-4 text-center">
          <span>Sudah punya akun? </span>
          <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </div>
      </form>
    </div>
  );
}