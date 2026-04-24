import React from 'react';

interface ConflictModalProps {
  existingData: any[];
  incomingData: any[];
  onResolve: (decision: 'overwrite' | 'keep_existing') => void;
}

export default function ConflictModal({ existingData, incomingData, onResolve }: ConflictModalProps) {
  if (!existingData.length) return null;

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h2 style={{ color: '#d9534f' }}> Data Conflict Detected</h2>
        <p>Another user or previous upload contains data with the same IDs. Please choose how to resolve this.</p>

        <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
          {incomingData.map((newRow) => {
            const oldRow = existingData.find(ex => ex.id === parseInt(newRow.id));
            return (
              <div key={newRow.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
                <h4>Row ID: {newRow.id}</h4>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '10px' }}>
                    <strong>Current Database Version:</strong>
                    <pre>{JSON.stringify(oldRow, null, 2)}</pre>
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#eefcf5', padding: '10px' }}>
                    <strong>Incoming CSV Version:</strong>
                    <pre>{JSON.stringify(newRow, null, 2)}</pre>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => onResolve('keep_existing')}
            style={{ padding: '10px', backgroundColor: '#6c757d', color: 'white' }}>
            Keep Existing Data
          </button>
          <button 
            onClick={() => onResolve('overwrite')}
            style={{ padding: '10px', backgroundColor: '#007bff', color: 'white' }}>
            Overwrite with New CSV
          </button>
        </div>
      </div>
    </div>
  );
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: 'white', padding: '30px', borderRadius: '8px',
  width: '80%', maxWidth: '900px'
};