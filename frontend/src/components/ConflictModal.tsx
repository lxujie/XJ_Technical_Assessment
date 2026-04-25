import React from 'react';

interface ConflictModalProps {
  existingData: any[];
  incomingData: any[];
  onResolve: (decision: 'overwrite' | 'keep_existing') => void;
}

export default function ConflictModal({ existingData, incomingData, onResolve }: ConflictModalProps) {
    if (!existingData.length) return null;

    const fields = ['id', 'post_id', 'name', 'email', 'body'];

    return (
    <div style={modalOverlayStyle} onClick={() => onResolve('keep_existing')}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ color: '#d9534f', marginTop: 0 }}>Data Conflict Detected</h2>
        <p style={{ color: '#555', marginBottom: '20px' }}>
          Another user or previous upload contains data with the same IDs. Please review the changes below and choose how to resolve this.
        </p>

        <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '10px', marginBottom: '20px' }}>
          {incomingData.map((newRow) => {
            // Safely find the old row, matching on string just in case of type mismatches
            const oldRow = existingData.find(ex => String(ex.id) === String(newRow.id));
            
            return (
              <div key={newRow.id} style={rowContainerStyle}>
                <h4 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                  Row ID: {newRow.id}
                </h4>
                
                <div style={{ display: 'flex', gap: '2px', backgroundColor: '#ddd', border: '1px solid #ddd' }}>
                  
                  {/* Left Column: Current DB */}
                  <div style={{ flex: 1, backgroundColor: '#fdfdfd', padding: '15px' }}>
                    <div style={columnHeaderStyle}>Current Database Version</div>
                    {fields.map(field => (
                      <div key={`old-${field}`} style={fieldStyle}>
                        <span style={labelStyle}>{field}:</span>
                        <span>{oldRow ? oldRow[field] : 'N/A'}</span>
                      </div>
                    ))}
                  </div>

                  {/* Right Column: Incoming CSV */}
                  <div style={{ flex: 1, backgroundColor: '#fffafb', padding: '15px' }}>
                    <div style={columnHeaderStyle}>Incoming CSV Version</div>
                    {fields.map(field => {
                      const oldVal = oldRow ? String(oldRow[field]) : '';
                      const newVal = String(newRow[field]);
                      const isDifferent = oldVal !== newVal;

                      return (
                        <div key={`new-${field}`} style={fieldStyle}>
                          <span style={labelStyle}>{field}:</span>
                          <span style={{ 
                            color: isDifferent ? '#d9534f' : 'inherit', 
                            fontWeight: isDifferent ? 'bold' : 'normal',
                            backgroundColor: isDifferent ? '#fdeced' : 'transparent',
                            padding: isDifferent ? '2px 4px' : '0',
                            borderRadius: '3px'
                          }}>
                            {newRow[field] || 'N/A'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <button 
            onClick={() => onResolve('keep_existing')}
            style={btnSecondaryStyle}>
            Keep Existing Data
          </button>
          <button 
            onClick={() => onResolve('overwrite')}
            style={btnPrimaryStyle}>
            Overwrite with New CSV
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Styles ---

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
  backdropFilter: 'blur(3px)' // Adds a nice modern blur to the background
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#fff', padding: '30px', borderRadius: '12px',
  width: '90%', maxWidth: '1000px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  display: 'flex', flexDirection: 'column'
};

const rowContainerStyle: React.CSSProperties = {
  border: '1px solid #e0e0e0', 
  borderRadius: '8px', 
  marginBottom: '20px', 
  padding: '15px',
  backgroundColor: '#fafafa'
};

const columnHeaderStyle: React.CSSProperties = {
  fontWeight: 'bold', 
  fontSize: '14px', 
  textTransform: 'uppercase', 
  color: '#666',
  marginBottom: '15px',
  letterSpacing: '0.5px'
};

const fieldStyle: React.CSSProperties = {
  marginBottom: '10px',
  fontSize: '14px',
  lineHeight: '1.5',
  wordBreak: 'break-word'
};

const labelStyle: React.CSSProperties = {
  fontWeight: 600,
  display: 'inline-block',
  width: '70px',
  color: '#444'
};

const btnPrimaryStyle: React.CSSProperties = {
  padding: '12px 20px', backgroundColor: '#d9534f', color: 'white', 
  border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
  transition: 'background-color 0.2s'
};

const btnSecondaryStyle: React.CSSProperties = {
  padding: '12px 20px', backgroundColor: '#e2e6ea', color: '#333', 
  border: '1px solid #dae0e5', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
  transition: 'background-color 0.2s'
};