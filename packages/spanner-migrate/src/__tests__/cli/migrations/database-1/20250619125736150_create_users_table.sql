-- Created: 2025-06-19T12:57:36.150Z
-- Description: create users table

---- UP ----

CREATE TABLE users(id INT64 NOT NULL, username STRING(50) NOT NULL) PRIMARY KEY (id);



---- DOWN ----

DROP TABLE users;