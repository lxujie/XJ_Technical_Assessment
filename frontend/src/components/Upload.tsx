import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Upload({ onUploadSuccess, socketId, resetTrigger }: { onUploadSuccess: () => void, socketId: string, resetTrigger: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resetTrigger > 0) {
      setFile(null);
      setProgress(0);
      setStatus('');
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Visually clears the input field
      }
    }
  }, [resetTrigger]);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
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
        if (fileInputRef.current) fileInputRef.current.value = '';
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
        ref={fileInputRef} 
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
      {status && <p style={{ marginTop: '10px', color: status.includes('failed') || status.includes('Conflict') ? '#d9534f' : '#28a745' }}>
        {status}
      </p>}
    </div>
  );
}