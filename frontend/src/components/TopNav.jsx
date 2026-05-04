import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import {
  Combine,
  Scissors,
  Zap,
  ArrowRightLeft,
  LayoutGrid,
  Image as ImageIcon,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import "./TopNav.css";

function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function TopNav() {
  const [tools, setTools] = useState([]);
  const [showMega, setShowMega] = useState(false);
  const [showImageMega, setShowImageMega] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
    fetch(`${apiBaseUrl}/api/tools`)
      .then((res) => res.json())
      .then((data) => setTools(data.tools || []))
      .catch(() => setTools([]));
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setShowMega(false);
    setShowImageMega(false);
    setShowConvert(false);
  }, [location]);

  const pdfTools = tools.filter(
    (group) => !group.category.toLowerCase().startsWith("image"),
  );
  const imageTools = tools.filter((group) =>
    group.category.toLowerCase().startsWith("image"),
  );

  const quickLinks = [
    { label: "Merge PDF", slug: "merge-pdf", icon: <Combine size={18} /> },
    { label: "Split PDF", slug: "split-pdf", icon: <Scissors size={18} /> },
    { label: "Compress PDF", slug: "compress-pdf", icon: <Zap size={18} /> },
  ];

  return (
    <div
      className="top-nav-container"
      onMouseLeave={() => {
        setShowMega(false);
        setShowConvert(false);
        setShowImageMega(false);
      }}
    >
      <nav className="top-nav-menu">
        <div className="top-nav-brand">
          <Link to="/" className="brand-link">
            <Sparkles className="brand-icon-img" size={28} color="#e11d48" />
            <span className="brand-icon">Student Toolkit</span>
          </Link>
        </div>

        <div className="top-nav-links">
          {quickLinks.map((link) => (
            <Link
              key={link.slug}
              to={`/tool/${link.slug}`}
              className={`top-nav-link ${location.pathname === `/tool/${link.slug}` ? "active" : ""}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}

          <button
            type="button"
            className="top-nav-link"
            onMouseEnter={() => {
              setShowConvert(true);
              setShowMega(false);
              setShowImageMega(false);
            }}
          >
            <ArrowRightLeft size={18} />
            Convert PDF <ChevronDown className="dropdown-arrow" size={14} />
          </button>

          <button
            type="button"
            className="top-nav-link"
            onMouseEnter={() => {
              setShowMega(true);
              setShowImageMega(false);
              setShowConvert(false);
            }}
          >
            <LayoutGrid size={18} />
            All PDF Tools <ChevronDown className="dropdown-arrow" size={14} />
          </button>

          <button
            type="button"
            className="top-nav-link"
            onMouseEnter={() => {
              setShowImageMega(true);
              setShowMega(false);
              setShowConvert(false);
            }}
          >
            <ImageIcon size={18} />
            All Image Tools <ChevronDown className="dropdown-arrow" size={14} />
          </button>
        </div>

        <div className="top-nav-actions">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      {showConvert && (
        <div className="mega-dropdown">
          <div className="mega-grid">
            {pdfTools
              .filter((group) => group.category.includes("Convert"))
              .map((group) => (
                <div key={group.category} className="mega-column">
                  <h4>{group.category}</h4>
                  {group.items.map((item) => (
                    <Link
                      key={item}
                      to={`/tool/${createSlug(item)}`}
                      className="mega-item"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              ))}
          </div>
        </div>
      )}

      {showMega && (
        <div className="mega-dropdown">
          <div className="mega-grid">
            {pdfTools.map((group) => (
              <div key={group.category} className="mega-column">
                <h4>{group.category}</h4>
                {group.items.map((item) => (
                  <Link
                    key={item}
                    to={`/tool/${createSlug(item)}`}
                    className="mega-item"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {showImageMega && imageTools.length > 0 && (
        <div className="mega-dropdown">
          <div className="mega-grid">
            {imageTools.map((group) => (
              <div key={group.category} className="mega-column">
                <h4>{group.category}</h4>
                {group.items.map((item) => (
                  <Link
                    key={item}
                    to={`/tool/${createSlug(item)}`}
                    className="mega-item"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TopNav;
