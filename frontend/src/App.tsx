import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Upload from './components/Upload';
import DataTable from './components/DataTable';
import ConflictModal from './components/ConflictModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const socket = io(API_URL);

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [conflictState, setConflictState] = useState<{ existing: any[], incoming: any[] } | null>(null);
  const [socketId, setSocketId] = useState<string>('');
  
  const [resetUploadTrigger, setResetUploadTrigger] = useState(0);

  useEffect(() => {
    socket.on('connect', () => {
      if (socket.id) setSocketId(socket.id);
    });

    socket.on('conflict_detected', (payload) => {
      setConflictState({
        existing: payload.existingData,
        incoming: payload.incomingData
      });
    });

    socket.on('data_updated', () => {
      setRefreshTrigger(prev => prev + 1);
    });

    return () => {
      socket.off('connect');
      socket.off('conflict_detected');
      socket.off('data_updated');
    };
  }, []);

  const handleUploadSuccess = () => {
    socket.emit('data_updated'); 
  };

  const handleResolveConflict = (decision: 'overwrite' | 'keep_existing') => {
    if (!conflictState) return;

    socket.emit('resolve_conflict', {
      resolution: decision,
      incomingData: conflictState.incoming
    });

    setConflictState(null);
    setResetUploadTrigger(prev => prev + 1); 
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Real-Time Data Manager</h1>
      
      <Upload 
        onUploadSuccess={handleUploadSuccess} 
        socketId={socketId} 
        resetTrigger={resetUploadTrigger} 
      />
      
      <DataTable refreshTrigger={refreshTrigger} />

      {conflictState && (
        <ConflictModal 
          existingData={conflictState.existing} 
          incomingData={conflictState.incoming} 
          onResolve={handleResolveConflict} 
        />
      )}
    </div>
  );
}