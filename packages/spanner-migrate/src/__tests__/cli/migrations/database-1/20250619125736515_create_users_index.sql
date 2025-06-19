-- Created: 2025-06-19T12:57:36.515Z
-- Description: create users index

---- UP ----

CREATE INDEX ix_users ON users (username);



---- DOWN ----

DROP INDEX ix_users;