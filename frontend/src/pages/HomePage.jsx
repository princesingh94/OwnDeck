import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center">
      <p className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-coral">Consumer Lifecycle Manager</p>
      <h1 className="mt-5 text-5xl font-bold leading-tight text-ink sm:text-6xl">
        Never Lose Track of
        <span className="block text-coral">Warranties Again</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-slate-700">
        Upload invoices, auto-extract product details with AI, get expiry alerts, and generate complaint drafts instantly.
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/signup" className="rounded-xl bg-coral px-6 py-3 font-semibold text-white shadow-neon">Get Started</Link>
        <Link to="/login" className="rounded-xl border border-ink px-6 py-3 font-semibold text-ink">Login</Link>
      </div>
    </section>
  );
};

export default HomePage;
