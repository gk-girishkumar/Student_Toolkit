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
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tools`)
      .then((res) => res.json())
      .then((data) => setTools(data.tools || []))
      .catch(() => setTools([]));
  }, []);

  return (
    <section className="tool-menu">
      {tools.map((group) => (
        <div key={group.category} className="tool-category">
          <h2>{group.category}</h2>
          <div className="tool-list">
            {group.items.map((item) => (
              <div key={item} className="tool-card">
                <span>{item}</span>
                <Link to={`/tool/${createSlug(item)}`} className="tool-button">
                  Open
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default ToolMenu;
