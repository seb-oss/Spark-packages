// 2025-01-20T14:56:38.000Z
// create table users

export const up = `
  CREATE TABLE users (
    id INT64 NOT NULL,
    username STRING(50) NOT NULL,
    email STRING(100) NOT NULL,
  ) PRIMARY KEY (id);
`;

export const down = `
  DROP TABLE users;
`;