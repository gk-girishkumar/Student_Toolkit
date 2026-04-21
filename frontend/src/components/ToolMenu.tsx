import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './ToolMenu.css';

interface ToolCategory {
  category: string;
  items: string[];
}

function createSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function ToolMenu() {
  const [tools, setTools] = useState<ToolCategory[]>([]);

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

    fetch(`${apiBaseUrl}/api/tools`)
      .then((res) => res.json())
      .then((data) => setTools(data.tools || []))
      .catch(() => setTools([]));
  }, []);

  const pdfSections = tools.filter((group) => !group.category.toLowerCase().startsWith('image'));
  const imageSections = tools.filter((group) => group.category.toLowerCase().startsWith('image'));

  const renderGroupItems = (group: ToolCategory) => (
    <div key={group.category} className="tool-subcategory">
      <h3>{group.category}</h3>
      <div className="tool-item-list">
        {group.items.map((item) => (
          <Link key={item} to={`/tool/${createSlug(item)}`} className="tool-item-link">
            <span>{item}</span>
            <span className="tool-item-action">Open</span>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <section className="tool-menu">
      <div className="tool-section">
        <div className="tool-section-header">
          <h2>PDF Tools</h2>
        </div>
        <div className="tool-section-content">
          {pdfSections.length > 0 ? pdfSections.map(renderGroupItems) : <p>No PDF tools available.</p>}
        </div>
      </div>

      <div className="tool-section">
        <div className="tool-section-header">
          <h2>Image Tools</h2>
        </div>
        <div className="tool-section-content">
          {imageSections.length > 0 ? imageSections.map(renderGroupItems) : <p>No Image tools available.</p>}
        </div>
      </div>
    </section>
  );
}

export default ToolMenu;
