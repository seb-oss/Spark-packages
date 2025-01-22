-- Created: 2025-01-21T14:48:38.000Z
-- Description: create table and index adresses

---- UP ----

CREATE TABLE addresses (
  id STRING(36) NOT NULL, -- Unique identifier for the address
  user_id STRING(36) NOT NULL, -- ID of the user associated with the address
  street STRING(256), -- Street name and number
  city STRING(128), -- City name
  state STRING(128), -- State or region
  zip_code STRING(16), -- Postal code
  country STRING(128), -- Country name
  created_at TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true), -- Timestamp of creation
  updated_at TIMESTAMP OPTIONS (allow_commit_timestamp = true) -- Timestamp of last update
) PRIMARY KEY (id);

-- Create an index on user_id for faster lookups by user
CREATE INDEX idx_addresses_user_id ON addresses (user_id);


---- DOWN ----

-- Drop the index first (Spanner requires indexes to be dropped before dropping the table)
DROP INDEX idx_addresses_user_id;

-- Drop the table
DROP TABLE addresses;
