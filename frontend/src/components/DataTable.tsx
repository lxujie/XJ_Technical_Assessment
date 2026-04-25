import { useState, useEffect } from 'react';
import axios from 'axios';
import { useDebounce } from '../hooks/useDebounce';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CommentData { 
  id: number;
  post_id: number;
  name: string;
  email: string;
  body: string;
}

export default function DataTable({ refreshTrigger }: { refreshTrigger: number }) {
  const [data, setData] = useState<CommentData[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 10;

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch, refreshTrigger]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/data`, {
        params: { page, limit, search: debouncedSearch }
      });
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={containerStyle}>
      <div style={searchContainerStyle}>
        <input
          type="text"
          placeholder="Search by name, email, or body text..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInputStyle}
        />
      </div>

      <div style={tableWrapperStyle}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '6%' }}>ID</th>
              <th style={{ ...thStyle, width: '8%' }}>Post ID</th>
              <th style={{ ...thStyle, width: '22%' }}>Name</th>
              <th style={{ ...thStyle, width: '24%' }}>Email</th>
              <th style={{ ...thStyle, width: '40%' }}>Body</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={emptyStateStyle}>Loading data...</td></tr>
            ) : data.length > 0 ? data.map((row) => (
              <tr key={row.id} style={trStyle}>
                <td style={tdStyle}>{row.id}</td>
                <td style={tdStyle}>{row.post_id}</td>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{row.name}</td>
                <td style={{ ...tdStyle, opacity: 0.8 }}>{row.email}</td>
                <td style={{ ...tdStyle, fontSize: '14px', lineHeight: '1.6' }}>
                  {/* Clean up the literal \n characters from the database string */}
                  {row.body.replace(/\\n/g, ' ')}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} style={emptyStateStyle}>No data found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={paginationContainerStyle}>
        <button 
          disabled={page === 1 || isLoading} 
          onClick={() => setPage(page - 1)}
          style={{ ...btnStyle, opacity: page === 1 || isLoading ? 0.5 : 1 }}
        >
          Previous
        </button>
        <span style={{ fontWeight: 500 }}>
          Page {page} of {totalPages || 1} <span style={{ opacity: 0.6, fontSize: '14px', marginLeft: '8px' }}>(Total: {total})</span>
        </span>
        <button 
          disabled={page >= totalPages || isLoading} 
          onClick={() => setPage(page + 1)}
          style={{ ...btnStyle, opacity: page >= totalPages || isLoading ? 0.5 : 1 }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// Styles safely formulated to adapt to both Light and Dark mode depending on your Vite CSS
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  width: '100%'
};

const searchContainerStyle: React.CSSProperties = {
  position: 'relative'
};

const searchInputStyle: React.CSSProperties = {
  width: '100%', 
  padding: '14px 20px', 
  borderRadius: '8px',
  border: '1px solid rgba(128, 128, 128, 0.3)',
  fontSize: '16px',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s',
  backgroundColor: 'rgba(128, 128, 128, 0.05)',
  color: 'inherit'
};

const tableWrapperStyle: React.CSSProperties = {
  overflowX: 'auto',
  borderRadius: '8px',
  border: '1px solid rgba(128, 128, 128, 0.2)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
};

const thStyle: React.CSSProperties = {
  padding: '16px',
  borderBottom: '2px solid rgba(128, 128, 128, 0.2)',
  textTransform: 'uppercase',
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.5px',
  opacity: 0.7
};

const trStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(128, 128, 128, 0.1)',
  transition: 'background-color 0.2s'
};

const tdStyle: React.CSSProperties = {
  padding: '16px',
  verticalAlign: 'top', // Forces all text to start at the top of the row
  wordWrap: 'break-word'
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center', 
  padding: '40px',
  opacity: 0.6,
  fontSize: '16px'
};

const paginationContainerStyle: React.CSSProperties = {
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  padding: '10px 0'
};

const btnStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: '6px',
  border: '1px solid rgba(128, 128, 128, 0.3)',
  backgroundColor: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  fontWeight: 600,
  transition: 'all 0.2s'
};