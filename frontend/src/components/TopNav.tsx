import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, UserButton } from '@clerk/clerk-react';
import './TopNav.css';

interface ToolCategory {
  category: string;
  items: string[];
}

function createSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function TopNav() {
  const [tools, setTools] = useState<ToolCategory[]>([]);
  const [showMega, setShowMega] = useState(false);
  const [showImageMega, setShowImageMega] = useState(false);
  const [showConvert, setShowConvert] = useState(false);

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    fetch(`${apiBaseUrl}/api/tools`)
      .then((res) => res.json())
      .then((data) => setTools(data.tools || []))
      .catch(() => setTools([]));
  }, []);

  const pdfTools = tools.filter((group) => !group.category.toLowerCase().startsWith('image'));
  const imageTools = tools.filter((group) => group.category.toLowerCase().startsWith('image'));

  const quickLinks = [
    { label: 'Merge PDF', slug: 'merge-pdf' },
    { label: 'Split PDF', slug: 'split-pdf' },
    { label: 'Compress PDF', slug: 'compress-pdf' },
  ];

  return (
    <div className="top-nav-container" onMouseLeave={() => { setShowMega(false); setShowConvert(false); }}>
      <nav className="top-nav-menu">
        <div className="top-nav-brand">
          <span className="brand-icon">Student Toolkit</span>
        </div>

        <div className="top-nav-links">
          {quickLinks.map((link) => (
            <Link key={link.slug} to={`/tool/${link.slug}`} className="top-nav-link">
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            className="top-nav-link top-nav-dropdown"
            onMouseEnter={() => setShowConvert(true)}
            onClick={() => setShowConvert((prev) => !prev)}
          >
            Convert PDF <span className="dropdown-arrow">▾</span>
          </button>
          <button
            type="button"
            className="top-nav-link top-nav-dropdown"
            onMouseEnter={() => {
              setShowMega(true);
              setShowImageMega(false);
            }}
            onClick={() => {
              setShowMega((prev) => !prev);
              setShowImageMega(false);
            }}
          >
            All PDF Tools <span className="dropdown-arrow">{showMega ? '▴' : '▾'}</span>
          </button>
          <button
            type="button"
            className="top-nav-link top-nav-dropdown"
            onMouseEnter={() => {
              setShowImageMega(true);
              setShowMega(false);
            }}
            onClick={() => {
              setShowImageMega((prev) => !prev);
              setShowMega(false);
            }}
          >
            All Image Tools <span className="dropdown-arrow">{showImageMega ? '▴' : '▾'}</span>
          </button>
        </div>

        <div className="top-nav-actions">
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      {showConvert && (
        <div className="mega-dropdown convert-dropdown">
          <div className="mega-grid">
            {pdfTools
              .filter((group) => group.category.includes('Convert'))
              .map((group) => (
                <div key={group.category} className="mega-column">
                  <h4>{group.category}</h4>
                  {group.items.map((item) => (
                    <Link key={item} to={`/tool/${createSlug(item)}`} className="mega-item">
                      {item}
                    </Link>
                  ))}
                </div>
              ))}
          </div>
        </div>
      )}

      {showMega && (
        <div className="mega-dropdown all-tools-dropdown">
          <div className="mega-grid">
            {pdfTools.map((group) => (
              <div key={group.category} className="mega-column">
                <h4>{group.category}</h4>
                {group.items.map((item) => (
                  <Link key={item} to={`/tool/${createSlug(item)}`} className="mega-item">
                    {item}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {showImageMega && imageTools.length > 0 && (
        <div className="mega-dropdown all-tools-dropdown">
          <div className="mega-grid">
            {imageTools.map((group) => (
              <div key={group.category} className="mega-column">
                <h4>{group.category}</h4>
                {group.items.map((item) => (
                  <Link key={item} to={`/tool/${createSlug(item)}`} className="mega-item">
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
