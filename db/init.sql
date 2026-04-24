CREATE TABLE IF NOT EXISTS data_db (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    body TEXT
);

CREATE INDEX idx_data_db_name ON data_db(name);
CREATE INDEX idx_data_db_email ON data_db(email);