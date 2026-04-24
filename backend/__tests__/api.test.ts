import request from 'supertest';
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { app, pool } from '../src/index';

afterAll(async () => {
  await pool.end();
});

describe('API Edge Case Tests', () => {
  
  describe('GET /data (Pagination & Search Edge Cases)', () => {
    
    it('should handle negative page numbers gracefully', async () => {
      const response = await request(app).get('/data?page=-10');
      // Should default to page 1 rather than throwing a 500 SQL error
      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
    });

    it('should handle non-numeric limit parameters', async () => {
      const response = await request(app).get('/data?limit=abc');
      // Should default to limit 10
      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(10);
    });

    it('should safely process SQL injection attempts in search without crashing', async () => {
      // Parameterized queries ($1) protect us, but the app should still return 200 (with empty data)
      const maliciousSearch = "'; DROP TABLE data_db; --";
      const response = await request(app).get(`/data?search=${encodeURIComponent(maliciousSearch)}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /upload (File Handling Edge Cases)', () => {
    
    it('should return 400 if no file is attached', async () => {
      const response = await request(app).post('/upload');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No file uploaded');
    });

    it('should handle an empty CSV file without crashing', async () => {
      // Create a temporary empty file
      const emptyFilePath = path.join(__dirname, 'empty.csv');
      fs.writeFileSync(emptyFilePath, '');

      const response = await request(app)
        .post('/upload')
        .attach('file', emptyFilePath);

      // Clean up
      fs.unlinkSync(emptyFilePath);

      // Should process the file, find 0 rows, and return success
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Data imported successfully');
    });

    it('should trigger rollback and return 500 if required columns are missing', async () => {
      // Create a CSV missing the mandatory 'id' and 'post_id' columns
      const badCsvPath = path.join(__dirname, 'bad_data.csv');
      fs.writeFileSync(badCsvPath, 'name,email\nTest User,test@test.com');

      const response = await request(app)
        .post('/upload')
        .attach('file', badCsvPath);

      // Clean up
      fs.unlinkSync(badCsvPath);

      // The database NOT NULL constraint should fail, triggering the catch block and ROLLBACK
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to insert data into database');
    });

  });
});