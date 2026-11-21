
import express from "express";
import cors from "cors";
import db from "./database.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Comprobar servidor
app.get("/", (req, res) => {
  res.send("Servidor de inventario Bershka funcionando");
});

// Consultar productos
app.get("/api/productos", (req, res) => {
  const productos = db.prepare(`
    SELECT
      id,
      codigo AS code,
      nombre AS name,
      descripcion AS description,
      talla AS size,
      color,
      stock,
      minimo AS minimum,
      demanda AS demand,
      estado AS status
    FROM productos
    ORDER BY id DESC
  `).all();

  res.json(productos);
});

app.get("/api/movimientos", (req, res) => {
  const movimientos = db.prepare(`
    SELECT
      movimientos.id,
      movimientos.tipo AS type,
      productos.codigo AS code,
      productos.nombre AS product,
      movimientos.cantidad AS quantity,
      movimientos.fecha AS date
    FROM movimientos
    INNER JOIN productos
      ON movimientos.producto_id = productos.id
    ORDER BY movimientos.id DESC
  `).all();

  res.json(movimientos);
});

app.post("/api/movimientos", (req, res) => {
  try {
    const { productId, type, quantity } = req.body;

    if (
      !productId ||
      !["Entrada", "Salida"].includes(type) ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) <= 0
    ) {
      return res.status(400).json({
        error: "Verifica el producto, el tipo y la cantidad."
      });
    }

    const producto = db.prepare(
      "SELECT * FROM productos WHERE id = ?"
    ).get(productId);

    if (!producto) {
      return res.status(404).json({
        error: "Producto no encontrado."
      });
    }

    const cantidad = Number(quantity);

    if (type === "Salida" && cantidad > producto.stock) {
      return res.status(400).json({
        error: "No hay suficientes existencias para realizar esta salida."
      });
    }

    const nuevoStock = type === "Entrada"
      ? producto.stock + cantidad
      : producto.stock - cantidad;

    const registrarMovimiento = db.transaction(() => {
      db.prepare(`
        UPDATE productos
        SET stock = ?, estado = ?
        WHERE id = ?
      `).run(
        nuevoStock,
        nuevoStock > 0 ? "Activo" : "Agotado",
        productId
      );

      const resultado = db.prepare(`
        INSERT INTO movimientos (producto_id, tipo, cantidad)
        VALUES (?, ?, ?)
      `).run(productId, type, cantidad);

      return resultado.lastInsertRowid;
    });

    const movementId = registrarMovimiento();

    res.status(201).json({
      mensaje: "Movimiento registrado correctamente.",
      id: movementId,
      productId: Number(productId),
      type,
      quantity: cantidad,
      stock: nuevoStock
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "No se pudo registrar el movimiento."
    });
  }
});

// Registrar producto
app.post("/api/productos", (req, res) => {
  try {
    const {
      code, name, description, size,
      color, stock, minimum, status
    } = req.body;

    if (
      !code?.trim() ||
      !name?.trim() ||
      !description?.trim() ||
      !size?.trim() ||
      !color?.trim() ||
      stock === undefined ||
      minimum === undefined ||
      !status
    ) {
      return res.status(400).json({
        error: "Completa todos los campos obligatorios."
      });
    }

    if (
      !Number.isInteger(Number(stock)) ||
      !Number.isInteger(Number(minimum)) ||
      Number(stock) < 0 ||
      Number(minimum) < 0
    ) {
      return res.status(400).json({
        error: "Las cantidades deben ser números enteros positivos o cero."
      });
    }

    const resultado = db.prepare(`
      INSERT INTO productos
      (codigo, nombre, descripcion, talla, color,
       precio, stock, minimo, demanda, estado)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?, 0, ?)
    `).run(
      code.trim(),
      name.trim(),
      description.trim(),
      size.trim(),
      color.trim(),
      Number(stock),
      Number(minimum),
      status
    );

    res.status(201).json({
      mensaje: "Producto registrado correctamente.",
      id: resultado.lastInsertRowid
    });

  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        error: "Este código de producto ya existe."
      });
    }

    res.status(500).json({
      error: "No se pudo registrar el producto."
    });
  }
});

// Modificar producto
app.put("/api/productos/:id", (req, res) => {
  try {
    const {
      code, name, description, size,
      color, stock, minimum, demand, status
    } = req.body;

    const resultado = db.prepare(`
      UPDATE productos SET
        codigo = ?, nombre = ?, descripcion = ?,
        talla = ?, color = ?, stock = ?,
        minimo = ?, demanda = ?, estado = ?
      WHERE id = ?
    `).run(
      code, name, description, size, color,
      Number(stock), Number(minimum),
      Number(demand ?? 0), status, req.params.id
    );

    if (!resultado.changes) {
      return res.status(404).json({
        error: "Producto no encontrado."
      });
    }

    res.json({ mensaje: "Producto actualizado correctamente." });

  } catch (error) {
    res.status(400).json({
      error: "No se pudo actualizar el producto."
    });
  }
});

// Eliminar producto

// Eliminar producto
app.delete("/api/productos/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    const producto = db.prepare(
      "SELECT id FROM productos WHERE id = ?"
    ).get(id);

    if (!producto) {
      return res.status(404).json({
        error: "Producto no encontrado."
      });
    }

    const movimientos = db.prepare(
      "SELECT COUNT(*) AS total FROM movimientos WHERE producto_id = ?"
    ).get(id);

    if (movimientos.total > 0) {
      return res.status(409).json({
        error: "No se puede eliminar este producto porque tiene movimientos registrados."
      });
    }

    db.prepare(
      "DELETE FROM productos WHERE id = ?"
    ).run(id);

    res.json({
      mensaje: "Producto eliminado correctamente."
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "No se pudo eliminar el producto."
    });
  }
});


app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});
