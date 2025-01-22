-- Created: 2025-01-20T14:56:38.000Z
-- Description: create table users

---- UP ----

CREATE TABLE users (
  id INT64 NOT NULL,
  username STRING(50) NOT NULL,
  email STRING(100) NOT NULL,
) PRIMARY KEY (id);

---- DOWN ----

DROP TABLE users;
