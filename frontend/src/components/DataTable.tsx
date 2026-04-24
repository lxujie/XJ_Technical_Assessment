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
  const limit = 10;

  // Wait 500ms after the user stops typing before setting the actual search term
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch, refreshTrigger]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/data`, {
        params: { page, limit, search: debouncedSearch }
      });
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <input
        type="text"
        placeholder="Search name, email, or body..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '20px' }}
      />

      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th>ID</th>
            <th>Post ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Body</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? data.map((row) => (
            <tr key={row.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{row.id}</td>
              <td>{row.post_id}</td>
              <td>{row.name}</td>
              <td>{row.email}</td>
              <td>{row.body}</td>
            </tr>
          )) : (
            <tr><td colSpan={5}>No data found.</td></tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {page} of {totalPages || 1} (Total: {total})</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}