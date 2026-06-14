import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const badgeClass = {
  Active: "bg-emerald-100 text-emerald-700",
  Expiring: "bg-amber-100 text-amber-700",
  Expired: "bg-red-100 text-red-700"
};

const DashboardPage = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your OwnDeck</h1>
        <Link to="/upload" className="rounded-lg bg-teal px-4 py-2 font-semibold text-white">Upload Invoice</Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {products.map((p) => (
          <Link key={p._id} to={`/products/${p._id}`} className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-neon">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-bold">{p.productName}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass[p.warrantyStatus]}`}>{p.warrantyStatus}</span>
            </div>
            <p className="text-sm text-slate-600">Vendor: {p.vendor || "N/A"}</p>
            <p className="text-sm text-slate-600">Purchased: {new Date(p.purchaseDate).toLocaleDateString()}</p>
            <p className="text-sm text-slate-600">Expiry: {new Date(p.warrantyExpiryDate).toLocaleDateString()}</p>
            <p className="mt-2 text-sm font-semibold text-coral">₹ {Number(p.price || 0).toLocaleString()}</p>
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-orange-300 p-8 text-center">
          No products yet. Upload your first invoice.
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

