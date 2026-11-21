
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, "bershka.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    categoria TEXT,
    talla TEXT,
    color TEXT,
    precio REAL NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Agregar las columnas que necesita nuestra interfaz
const columnas = [
  ["descripcion", "TEXT"],
  ["minimo", "INTEGER NOT NULL DEFAULT 0"],
  ["demanda", "INTEGER NOT NULL DEFAULT 0"],
  ["estado", "TEXT NOT NULL DEFAULT 'Activo'"]
];

const existentes = db.prepare(
  "PRAGMA table_info(productos)"
).all().map(columna => columna.name);

for (const [nombre, tipo] of columnas) {
  if (!existentes.includes(nombre)) {
    db.exec(`ALTER TABLE productos ADD COLUMN ${nombre} ${tipo}`);
  }
}
db.exec(`
  CREATE TABLE IF NOT EXISTS movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
  );
`);

console.log("Base de datos Bershka preparada correctamente.");

export default db;
