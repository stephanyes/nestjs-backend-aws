-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear tabla books
CREATE TABLE IF NOT EXISTS books (
  "bookId" VARCHAR PRIMARY KEY,
  "title" VARCHAR NOT NULL,
  "author" VARCHAR NOT NULL,
  "publicationYear" INT NOT NULL,
  "views" INT NOT NULL DEFAULT 0
);

-- Crear tabla book_logs
CREATE TABLE IF NOT EXISTS book_logs (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "bookId" VARCHAR NOT NULL,
  "operation" VARCHAR NOT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  "author" VARCHAR NOT NULL,
  "title" VARCHAR NOT NULL
);

-- Insertar libros con views actualizados
INSERT INTO books ("bookId", "title", "author", "publicationYear", "views") VALUES
('a908c5b8-52c8-42b5-ba00-0ec92cc9dca3', '1984', 'George Orwell', 1962, 63),
('2c9e51b7-1123-436c-a081-6d48629f2ee3', 'Dune', 'Frank Herbert', 1959, 25),
('37980432-c4d5-4afa-aa16-35e0c6cb0cb9', 'The Hobbit', 'J.R.R. Tolkien', 1956, 79),
('17fa2905-812b-4ef1-8f94-04d68ecae43f', 'Brave New World', 'Aldous Huxley', 1979, 39),
('ebda177d-f32c-4db5-956e-d3f032b498a3', 'Fahrenheit 451', 'Ray Bradbury', 1962, 10),
('5c428e47-4bf6-47df-92b8-9cefc34c03e0', 'The Catcher in the Rye', 'J.D. Salinger', 1976, 51),
('73564363-b64a-43e9-8aa0-bb7fb77a09d2', 'To Kill a Mockingbird', 'Harper Lee', 1995, 59),
('71e2d25e-3ccb-41e2-98a6-6346634c3101', 'The Great Gatsby', 'F. Scott Fitzgerald', 1981, 84),
('72c39b2a-88cb-415d-8962-934c988e59bd', 'The Lord of the Rings', 'J.K. Rowling', 2020, 3),
('7584ccbc-80eb-4296-ac06-1d657f1dba34', 'Harry Potter and the Sorcerer''s Stone', 'Kurt Vonnegut', 2003, 42),
('6a977185-43ad-48a7-bba1-582ace35f13b', 'Animal Farm', 'Margaret Atwood', 1944, 73),
('1e3b3626-9a28-495d-b6a4-d69d158b3bbc', 'Slaughterhouse-Five', 'William Gibson', 2018, 2),
('ac758765-bc23-4b8e-8276-20f825fe2b05', 'The Handmaid''s Tale', 'Philip K. Dick', 1969, 29),
('3e6cfae3-d0b6-4396-9fa5-9060a1ed6f81', 'Neuromancer', 'Cormac McCarthy', 1950, 94),
('359c2cef-d08e-4841-8f0b-c1725a947142', 'Do Androids Dream of Electric Sheep?', 'Stephen King', 2003, 29),
('4e237a79-b0a1-4dec-b924-451cf74f8644', 'Snow Crash', 'Anthony Burgess', 1974, 53),
('661f2f58-dbd4-4e99-a388-5d09d16af260', 'The Road', 'Lois Lowry', 2009, 63),
('3c0dd23e-5d9f-46b1-a8dc-9b79a0b59118', 'It', 'Orson Scott Card', 1930, 86),
('eb3ebc97-1906-4b18-88cb-c2f0e4412cb1', 'The Stand', 'Ursula K. Le Guin', 1955, 59),
('0b1258b0-5340-4211-87f2-b152e3517e95', 'The Shining', 'Isaac Asimov', 1954, 0),
('9ed75616-829f-40ee-bd62-547e45e29d79', 'A Clockwork Orange', 'George Orwell', 1967, 33),
('6e6b0925-5d08-4089-aa58-a27412b381a5', 'The Giver', 'Frank Herbert', 2009, 57),
('4d111200-3940-47ad-b79d-8103f0b79eff', 'Ender’s Game', 'J.R.R. Tolkien', 2011, 20),
('db2c8de5-29b4-4cfc-b6ed-e1d679aedf09', 'The Left Hand of Darkness', 'Aldous Huxley', 1987, 49),
('c81b5361-43de-4c0c-b1e8-bfdc8d0fe29c', 'I, Robot', 'Ray Bradbury', 1945, 64);

-- Insertar logs tipo CREATE
INSERT INTO book_logs ("bookId", "operation", "author", "title") VALUES
('a908c5b8-52c8-42b5-ba00-0ec92cc9dca3', 'CREATE', 'George Orwell', '1984'),
('2c9e51b7-1123-436c-a081-6d48629f2ee3', 'CREATE', 'Frank Herbert', 'Dune'),
('37980432-c4d5-4afa-aa16-35e0c6cb0cb9', 'CREATE', 'J.R.R. Tolkien', 'The Hobbit'),
('17fa2905-812b-4ef1-8f94-04d68ecae43f', 'CREATE', 'Aldous Huxley', 'Brave New World'),
('ebda177d-f32c-4db5-956e-d3f032b498a3', 'CREATE', 'Ray Bradbury', 'Fahrenheit 451'),
('5c428e47-4bf6-47df-92b8-9cefc34c03e0', 'CREATE', 'J.D. Salinger', 'The Catcher in the Rye'),
('73564363-b64a-43e9-8aa0-bb7fb77a09d2', 'CREATE', 'Harper Lee', 'To Kill a Mockingbird'),
('71e2d25e-3ccb-41e2-98a6-6346634c3101', 'CREATE', 'F. Scott Fitzgerald', 'The Great Gatsby'),
('72c39b2a-88cb-415d-8962-934c988e59bd', 'CREATE', 'J.K. Rowling', 'The Lord of the Rings'),
('7584ccbc-80eb-4296-ac06-1d657f1dba34', 'CREATE', 'Kurt Vonnegut', 'Harry Potter and the Sorcerer''s Stone'),
('6a977185-43ad-48a7-bba1-582ace35f13b', 'CREATE', 'Margaret Atwood', 'Animal Farm'),
('1e3b3626-9a28-495d-b6a4-d69d158b3bbc', 'CREATE', 'William Gibson', 'Slaughterhouse-Five'),
('ac758765-bc23-4b8e-8276-20f825fe2b05', 'CREATE', 'Philip K. Dick', 'The Handmaid''s Tale'),
('3e6cfae3-d0b6-4396-9fa5-9060a1ed6f81', 'CREATE', 'Cormac McCarthy', 'Neuromancer'),
('359c2cef-d08e-4841-8f0b-c1725a947142', 'CREATE', 'Stephen King', 'Do Androids Dream of Electric Sheep?'),
('4e237a79-b0a1-4dec-b924-451cf74f8644', 'CREATE', 'Anthony Burgess', 'Snow Crash'),
('661f2f58-dbd4-4e99-a388-5d09d16af260', 'CREATE', 'Lois Lowry', 'The Road'),
('3c0dd23e-5d9f-46b1-a8dc-9b79a0b59118', 'CREATE', 'Orson Scott Card', 'It'),
('eb3ebc97-1906-4b18-88cb-c2f0e4412cb1', 'CREATE', 'Ursula K. Le Guin', 'The Stand'),
('0b1258b0-5340-4211-87f2-b152e3517e95', 'CREATE', 'Isaac Asimov', 'The Shining'),
('9ed75616-829f-40ee-bd62-547e45e29d79', 'CREATE', 'George Orwell', 'A Clockwork Orange'),
('6e6b0925-5d08-4089-aa58-a27412b381a5', 'CREATE', 'Frank Herbert', 'The Giver'),
('4d111200-3940-47ad-b79d-8103f0b79eff', 'CREATE', 'J.R.R. Tolkien', 'Ender’s Game'),
('db2c8de5-29b4-4cfc-b6ed-e1d679aedf09', 'CREATE', 'Aldous Huxley', 'The Left Hand of Darkness'),
('c81b5361-43de-4c0c-b1e8-bfdc8d0fe29c', 'CREATE', 'Ray Bradbury', 'I, Robot');
