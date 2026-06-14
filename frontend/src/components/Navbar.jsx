import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-orange-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold tracking-tight text-ink">
          OwnDeck
        </Link>
        {user && (
          <nav className="flex items-center gap-4">
            <Link to="/dashboard" className="font-medium text-ink hover:text-coral">
              Dashboard
            </Link>
            <Link to="/upload" className="font-medium text-ink hover:text-coral">
              Upload
            </Link>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white"
            >
              Logout
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;

