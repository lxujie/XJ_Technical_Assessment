import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { Pool } from 'pg';

const app = express();
const server = http.createServer(app);

// Setup Socket.io for Real-Time Collaboration
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// Setup PostgreSQL Connection (Using Docker Environment Variables)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'assessment_db',
});

// Configure Multer for File Uploads
const upload = multer({ dest: 'uploads/' });

// --- WEBSOCKET CONNECTION ---
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.join('dashboard'); 

  // Listen for the frontend's resolution decision
  socket.on('resolve_conflict', async (payload) => {
    const { resolution, incomingData } = payload;
    
    try {
      if (resolution === 'overwrite') {
        // Use PostgreSQL ON CONFLICT (UPSERT) to cleanly overwrite
        const query = `
          INSERT INTO data_db (id, post_id, name, email, body)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE 
          SET post_id = EXCLUDED.post_id,
              name = EXCLUDED.name,
              email = EXCLUDED.email,
              body = EXCLUDED.body;
        `;
        
        for (const row of incomingData) {
          await pool.query(query, [row.id, row.post_id, row.name, row.email, row.body]); 
        }
      }

      // Broadcast to ALL connected clients that the data has changed
      io.to('dashboard').emit('data_updated');
      
    } catch (error) {
      console.error("Error resolving conflict:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// --- API ROUTES ---

// 1. Pagination & Search Endpoint
app.get('/data', async (req, res) => {
  try {
    const rawPage = parseInt(req.query.page as string);
    const page = rawPage > 0 ? rawPage : 1; // Forces negative numbers and 0 to become page 1
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : '%';

    const dataQuery = `
      SELECT * FROM data_db 
      WHERE name ILIKE $1 OR email ILIKE $1 OR body ILIKE $1 
      ORDER BY id ASC 
      LIMIT $2 OFFSET $3
    `;
    const countQuery = `
      SELECT COUNT(*) FROM data_db 
      WHERE name ILIKE $1 OR email ILIKE $1 OR body ILIKE $1
    `;

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, [search, limit, offset]),
      pool.query(countQuery, [search])
    ]);

    res.json({
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error while fetching data' });
  }
});

// 2. CSV Upload & Conflict Detection Endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const incomingData: any[] = [];

  // Parse CSV via stream
  fs.createReadStream(req.file.path)
    .pipe(csv({
      mapHeaders: ({ header }) => {
        const cleanHeader = header.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (cleanHeader === 'postid') return 'post_id';
        return cleanHeader;
      }
    }))
    .on('data', (row) => incomingData.push(row))
    .on('end', async () => {
      // Remove temp file
      fs.unlinkSync(req.file!.path);

      try {
        // Extract all IDs from the incoming CSV, filtering out invalid/NaN values
        const incomingIds = incomingData
          .map(row => parseInt(row.id))
          .filter(id => !isNaN(id));

        let existingRecords: any[] = [];

        if (incomingIds.length > 0) {
          const conflictCheckResult = await pool.query(
            'SELECT * FROM data_db WHERE id = ANY($1)',
            [incomingIds]
          );
          existingRecords = conflictCheckResult.rows;
        }

        // --- SMART CONFLICT DETECTION LOGIC ---
        const trueConflicts = incomingData.filter(incomingRow => {
          const existingRow = existingRecords.find(ex => ex.id == incomingRow.id);
          if (!existingRow) return false; 

          return existingRow.post_id != incomingRow.post_id ||
                 existingRow.name !== incomingRow.name ||
                 existingRow.email !== incomingRow.email ||
                 existingRow.body !== incomingRow.body;
        });

        // Separate out rows that are completely new or completely identical
        const cleanRows = incomingData.filter(row => !trueConflicts.some(tc => tc.id === row.id));

        // 1. Insert ALL clean rows immediately
        const client = await pool.connect();
        try {
          await client.query('BEGIN'); 
          
          const insertQuery = `
            INSERT INTO data_db (id, post_id, name, email, body) 
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE 
            SET post_id = EXCLUDED.post_id,
                name = EXCLUDED.name,
                email = EXCLUDED.email,
                body = EXCLUDED.body;
          `;

          for (const row of cleanRows) {
            await client.query(insertQuery, [row.id, row.post_id, row.name, row.email, row.body]);
          }

          await client.query('COMMIT'); 
        } catch (insertError) {
          await client.query('ROLLBACK'); 
          console.error("Database Insert Error:", insertError);
          return res.status(500).json({ error: 'Failed to insert data into database' });
        } finally {
          client.release(); 
        }

        // 2. Handle true conflicts if any exist
        if (trueConflicts.length > 0) {
          console.log(`Detected ${trueConflicts.length} data conflicts.`);

          const uploaderSocketId = req.body.socketId;

          if (uploaderSocketId) {
            io.to(uploaderSocketId).emit('conflict_detected', {
              existingData: existingRecords.filter(ex => trueConflicts.some(tc => tc.id == ex.id)),
              incomingData: trueConflicts
            });
          } else {
            io.to('dashboard').emit('conflict_detected', {
              existingData: existingRecords.filter(ex => trueConflicts.some(tc => tc.id == ex.id)),
              incomingData: trueConflicts
            });
          }

          // Force the frontend to update so the user can see the clean rows behind the modal
          if (cleanRows.length > 0) {
            io.to('dashboard').emit('data_updated'); 
          }

          return res.status(202).json({ 
            status: 'conflict', 
            message: 'Conflicts detected. Awaiting user resolution.' 
          });
        }
        
        // 3. If NO conflicts at all, finish successfully
        io.to('dashboard').emit('data_updated'); 
        return res.status(200).json({ status: 'success', message: 'Data imported successfully' });

      } catch (error) {
        console.error("Outer Error:", error);
        return res.status(500).json({ error: 'Error processing CSV data' });
      }
    });
});

const PORT = process.env.PORT || 3000;

// Export decoupling for Jest Testing
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Backend API running on port ${PORT}`);
  });
}

export { app, pool };