import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Upload({ onUploadSuccess, socketId }: { onUploadSuccess: () => void, socketId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('');

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    // NEW: Attach the user's socket ID to the upload request
    if (socketId) {
      formData.append('socketId', socketId);
    }

    setStatus('Uploading...');

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        },
      });

      if (response.status === 202) {
        setStatus('Conflict detected. Awaiting resolution...');
      } else {
        setStatus('Upload successful!');
        setProgress(0);
        setFile(null);
        onUploadSuccess(); 
      }
    } catch (error) {
      console.error(error);
      setStatus('Upload failed. Please try again.');
      setProgress(0);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', marginBottom: '20px' }}>
      <h3>Upload CSV Data</h3>
      <input 
        type="file" 
        accept=".csv" 
        onChange={(e) => setFile(e.target.files?.[0] || null)} 
      />
      <button onClick={handleUpload} disabled={!file || progress > 0}>
        Upload
      </button>
      
      {progress > 0 && (
        <div style={{ marginTop: '10px' }}>
          <progress value={progress} max="100" /> {progress}%
        </div>
      )}
      {status && <p>{status}</p>}
    </div>
  );
}