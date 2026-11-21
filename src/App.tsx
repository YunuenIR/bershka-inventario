import { useMemo, useState } from "react";

type Product = {
  id: number;
  code: string;
  name: string;
  description: string;
  size: string;
  color: string;
  stock: number;
  minimum: number;
  demand: number;
  status: "Activo" | "Agotado";
};

type Movement = {
  id: number;
  type: "Entrada" | "Salida";
  code: string;
  product: string;
  quantity: number;
  date: string;
};

type Screen = "register" | "detail" | "success" | "error" | "movement" | "alerts" | null;

const initialProducts: Product[] = [
  { id: 1, code: "BSK-1001", name: "Chaqueta", description: "Cazadora cropped con cremallera", size: "M", color: "Negro", stock: 18, minimum: 8, demand: 92, status: "Activo" },
  { id: 2, code: "BSK-1002", name: "Vestido", description: "Vestido fluido de tirantes", size: "S", color: "Rojo", stock: 7, minimum: 10, demand: 88, status: "Activo" },
  { id: 3, code: "BSK-1003", name: "Pantalón", description: "Pantalón denim tiro alto", size: "38", color: "Azul", stock: 24, minimum: 10, demand: 76, status: "Activo" },
  { id: 4, code: "BSK-1004", name: "Blusa", description: "Top ajustado sin mangas", size: "M", color: "Blanco", stock: 4, minimum: 6, demand: 64, status: "Activo" },
  { id: 5, code: "BSK-1005", name: "Falda", description: "Falda con bolsillos laterales", size: "S", color: "Caqui", stock: 31, minimum: 8, demand: 38, status: "Activo" },
  { id: 6, code: "BSK-1006", name: "Sudadera", description: "Sudadera básica con capucha", size: "L", color: "Gris", stock: 0, minimum: 12, demand: 27, status: "Agotado" },
];

const initialMovements: Movement[] = [
  { id: 1, type: "Salida", code: "BSK-1001", product: "Chaqueta", quantity: 3, date: "Hoy, 10:42" },
  { id: 2, type: "Entrada", code: "BSK-1003", product: "Pantalón", quantity: 20, date: "Hoy, 09:15" },
  { id: 3, type: "Salida", code: "BSK-1002", product: "Vestido", quantity: 2, date: "Ayer, 18:20" },
  { id: 4, type: "Entrada", code: "BSK-1005", product: "Falda", quantity: 12, date: "Ayer, 12:05" },
];

function Icon({ name, size = 19 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    home: <><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    box: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="m4 7 8 4 8-4v10l-8 4-8-4V7ZM12 11v10" /></>,
    move: <><path d="M7 7h12l-3-3m3 3-3 3M17 17H5l3 3m-3-3 3-3" /></>,
    alert: <><path d="M12 3 2.7 20h18.6L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="m9 18 6-6-6-6" />,
    trend: <path d="m3 17 6-6 4 4 7-8m-5 0h5v5" />,
    down: <path d="m6 9 6 6 6-6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    back: <path d="m15 18-6-6 6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function App() {
  const [template, setTemplate] = useState(1);
  const [products, setProducts] = useState(initialProducts);
  const [movements, setMovements] = useState(initialMovements);
  const [search, setSearch] = useState("");
  const [screen, setScreen] = useState<Screen>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => products.filter((product) =>
    `${product.name} ${product.code} ${product.color}`.toLowerCase().includes(search.toLowerCase()),
  ), [products, search]);

  const lowStock = products.filter((product) => product.stock <= product.minimum);
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);

  function addProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const requiredFields = ["name", "code", "description", "size", "color", "stock", "minimum", "status"];
    if (requiredFields.some((field) => !String(data.get(field) ?? "").trim())) {
      setScreen("error");
      return;
    }
    const stock = Number(data.get("stock"));
    setProducts((current) => [...current, {
      id: Date.now(),
      code: String(data.get("code")),
      name: String(data.get("name")),
      description: String(data.get("description")),
      size: String(data.get("size")),
      color: String(data.get("color")),
      stock,
      minimum: Number(data.get("minimum")),
      demand: 0,
      status: String(data.get("status")) as Product["status"],
    }]);
    setScreen("success");
  }

  function addMovement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const productId = Number(data.get("product"));
    const type = String(data.get("type")) as "Entrada" | "Salida";
    const quantity = Number(data.get("quantity"));
    const product = products.find((item) => item.id === productId);
    if (!product || !quantity) return;
    const newStock = type === "Entrada" ? product.stock + quantity : Math.max(0, product.stock - quantity);
    setProducts((current) => current.map((item) => item.id === productId ? { ...item, stock: newStock, status: newStock > 0 ? "Activo" : "Agotado" } : item));
    setMovements((current) => [{ id: Date.now(), type, code: product.code, product: product.name, quantity, date: "Ahora" }, ...current]);
    setScreen(null);
    setTemplate(3);
  }

  function navigateTemplate(nextTemplate: number) {
    setScreen(null);
    setTemplate(nextTemplate);
  }

  function showProduct(product: Product) {
    setSelectedProduct(product);
    setScreen("detail");
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="wordmark">BERSHKA <span>STOCK</span></div>
        <nav className="template-switcher" aria-label="Seleccionar plantilla">
          {[1, 2, 3].map((number) => <button key={number} className={screen === null && template === number ? "selected" : ""} onClick={() => navigateTemplate(number)}><b>0{number}</b> {number === 1 ? "Resumen" : number === 2 ? "Inventario" : "Control"}</button>)}
        </nav>
        <div className="store">ANTEA · QUERÉTARO, MÉXICO <span>LM</span></div>
      </header>

      <div className="mobile-templates">
        {[1, 2, 3].map((number) => <button key={number} className={screen === null && template === number ? "selected" : ""} onClick={() => navigateTemplate(number)}>Plantilla {number}</button>)}
      </div>

      {screen === null && template === 1 && (
        <main className="page">
          <PageTitle eyebrow="PLANTILLA 01 · RESUMEN OPERATIVO" title="Inventario" subtitle="Vista rápida del estado general de la tienda." action={() => setScreen("register")} actionText="Nuevo producto" />
          <section className="stats-grid">
            <Stat value={String(totalStock)} label="Unidades disponibles" detail="+12 esta semana" />
            <Stat value={String(products.length)} label="Referencias activas" detail="6 categorías" />
            <Stat value={String(lowStock.length)} label="Alertas de stock" detail="Requieren pedido" danger />
            <Stat value="38" label="Salidas hoy" detail="+8% vs. ayer" />
          </section>
          <section className="two-columns">
            <Panel title="Productos recientes" meta="Existencias actuales">
              <ProductTable products={products.slice(0, 5)} compact />
            </Panel>
            <Panel title="Alertas" meta={`${lowStock.length} productos en mínimo`}>
              <div className="alerts-list">
                {lowStock.map((product) => <article key={product.id}><span className="alert-icon"><Icon name="alert" /></span><div><strong>{product.name}</strong><small>{product.code} · Quedan {product.stock} unidades</small></div><button onClick={() => setScreen("movement")}>Pedir</button></article>)}
              </div>
            </Panel>
          </section>
          <section className="demand-strip">
            <div><span>MAYOR DEMANDA</span><strong>Chaqueta</strong><small>92 salidas en los últimos 30 días</small></div>
            <div className="demand-bars">{[48, 72, 55, 89, 68, 96, 78, 100, 84, 91].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
            <div className="demand-score"><Icon name="trend" size={24} /><strong>+18%</strong><span>este mes</span></div>
          </section>
        </main>
      )}

      {screen === null && template === 2 && (
        <main className="page">
          <PageTitle eyebrow="PLANTILLA 02 · CATÁLOGO Y EXISTENCIAS" title="Productos" subtitle="Consulta todos los datos de cada referencia." action={() => setScreen("register")} actionText="Registrar producto" />
          <div className="toolbar">
            <label className="search"><Icon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, código o color" /></label>
            <span>{filtered.length} productos</span>
          </div>
          <section className="catalog">
            <ProductTable products={filtered} onSelect={showProduct} />
          </section>
          <div className="catalog-note"><Icon name="alert" /><span>Las filas marcadas necesitan reposición. La alerta aparece cuando las existencias son iguales o inferiores al mínimo definido.</span></div>
        </main>
      )}

      {screen === null && template === 3 && (
        <main className="page">
          <PageTitle eyebrow="PLANTILLA 03 · MOVIMIENTOS Y DEMANDA" title="Control de stock" subtitle="Registra entradas y salidas. Las existencias se actualizan automáticamente." action={() => setScreen("movement")} actionText="Registrar movimiento" />
          <section className="control-layout">
            <Panel title="Últimos movimientos" meta="Actualizado ahora">
              <div className="movement-list">
                {movements.map((movement) => <article key={movement.id}><span className={movement.type === "Entrada" ? "in" : "out"}>{movement.type === "Entrada" ? "+" : "−"}{movement.quantity}</span><div><strong>{movement.product}</strong><small>{movement.code}</small></div><b>{movement.type}</b><time>{movement.date}</time></article>)}
              </div>
            </Panel>
            <Panel title="Demanda de productos" meta="Últimos 30 días">
              <div className="ranking">
                {[...products].sort((a, b) => b.demand - a.demand).map((product, index) => <article key={product.id}><b>0{index + 1}</b><div><strong>{product.name}</strong><span><i style={{ width: `${product.demand}%` }} /></span></div><em>{product.demand}</em></article>)}
              </div>
            </Panel>
          </section>
          <section className="minimums">
            <div><p>REPOSICIÓN NECESARIA</p><h2>{lowStock.length} productos</h2><span>Han alcanzado su cantidad mínima.</span></div>
            {lowStock.slice(0, 3).map((product) => <article key={product.id}><span>{product.color.slice(0, 1)}</span><div><strong>{product.name}</strong><small>Stock {product.stock} / Mín. {product.minimum}</small></div></article>)}
            <button onClick={() => setScreen("alerts")}>Revisar inventario <Icon name="arrow" /></button>
          </section>
        </main>
      )}

      {screen === "register" && <RegisterScreen onSubmit={addProduct} onBack={() => navigateTemplate(2)} />}
      {screen === "detail" && selectedProduct && <ProductDetail product={selectedProduct} onBack={() => navigateTemplate(2)} onMovement={() => setScreen("movement")} />}
      {screen === "success" && <ResultScreen type="success" onPrimary={() => navigateTemplate(2)} onSecondary={() => setScreen("register")} />}
      {screen === "error" && <ResultScreen type="error" onPrimary={() => setScreen("register")} onSecondary={() => navigateTemplate(2)} />}
      {screen === "movement" && <MovementScreen products={products} onSubmit={addMovement} onBack={() => navigateTemplate(3)} />}
      {screen === "alerts" && <AlertsScreen products={lowStock} onBack={() => navigateTemplate(3)} onMovement={() => setScreen("movement")} />}
    </div>
  );
}

function PageTitle({ eyebrow, title, subtitle, action, actionText }: { eyebrow: string; title: string; subtitle: string; action: () => void; actionText: string }) {
  return <section className="page-title"><div><p>{eyebrow}</p><h1>{title}</h1><span>{subtitle}</span></div><button onClick={action}><Icon name="plus" />{actionText}</button></section>;
}

function Stat({ value, label, detail, danger = false }: { value: string; label: string; detail: string; danger?: boolean }) {
  return <article className={danger ? "stat danger" : "stat"}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function Panel({ title, meta, children }: { title: string; meta: string; children: React.ReactNode }) {
  return <section className="panel"><header><h2>{title}</h2><span>{meta}</span></header>{children}</section>;
}

function ProductTable({ products, compact = false, onSelect }: { products: Product[]; compact?: boolean; onSelect?: (product: Product) => void }) {
  return <div className="table-wrap"><table><thead><tr><th>PRODUCTO</th>{!compact && <th>DESCRIPCIÓN</th>}<th>TALLA / COLOR</th><th>EXISTENCIAS</th><th>ESTADO</th></tr></thead><tbody>{products.map((product) => {
    const warning = product.stock <= product.minimum;
    return <tr key={product.id} className={warning ? "warning-row" : ""} onClick={() => onSelect?.(product)}><td><strong>{product.name}</strong><small>{product.code}</small></td>{!compact && <td>{product.description}</td>}<td>{product.size} · {product.color}</td><td><b>{product.stock}</b><small>Mín. {product.minimum}</small></td><td><span className={warning ? "badge warning" : "badge"}>{product.stock === 0 ? "Agotado" : warning ? "Stock bajo" : product.status}</span></td></tr>;
  })}</tbody></table></div>;
}

function ProductForm({ onSubmit, onCancel }: { onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  return <form onSubmit={onSubmit} className="form" noValidate><label>Nombre<input name="name" placeholder="Ej. Chaqueta denim" /></label><label>Código<input name="code" placeholder="BSK-1007" /></label><label className="wide">Descripción<input name="description" placeholder="Descripción breve del producto" /></label><label>Talla<input name="size" placeholder="S, M, L..." /></label><label>Color<input name="color" placeholder="Negro" /></label><label>Cantidad<input min="0" name="stock" type="number" placeholder="0" /></label><label>Stock mínimo<input min="0" name="minimum" type="number" placeholder="5" /></label><label className="wide">Estado<select name="status" defaultValue=""><option value="" disabled>Selecciona un estado</option><option>Activo</option><option>Agotado</option></select></label><div className="form-actions"><button type="button" onClick={onCancel}>Cancelar</button><button type="submit">Guardar producto</button></div></form>;
}

function MovementForm({ products, onSubmit, onCancel }: { products: Product[]; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  return <form onSubmit={onSubmit} className="form"><label className="wide">Producto<select required name="product">{products.map((product) => <option key={product.id} value={product.id}>{product.code} · {product.name} ({product.stock} uds.)</option>)}</select></label><label>Tipo<select name="type"><option>Entrada</option><option>Salida</option></select></label><label>Cantidad<input required min="1" name="quantity" type="number" placeholder="1" /></label><div className="form-actions"><button type="button" onClick={onCancel}>Cancelar</button><button type="submit">Actualizar stock</button></div></form>;
}

function ScreenHeader({ eyebrow, title, subtitle, onBack }: { eyebrow: string; title: string; subtitle: string; onBack: () => void }) {
  return <div className="screen-heading"><button className="back-button" onClick={onBack}><Icon name="back" /> Volver</button><p>{eyebrow}</p><h1>{title}</h1><span>{subtitle}</span></div>;
}

function RegisterScreen({ onSubmit, onBack }: { onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onBack: () => void }) {
  return <main className="page new-screen"><ScreenHeader eyebrow="INVENTARIO · NUEVA REFERENCIA" title="Registrar prenda" subtitle="Completa la información para incorporar una nueva prenda al inventario." onBack={onBack} /><section className="screen-card form-card"><div className="section-intro"><b>DATOS DE LA PRENDA</b><span>Todos los campos son obligatorios</span></div><ProductForm onSubmit={onSubmit} onCancel={onBack} /></section></main>;
}

function MovementScreen({ products, onSubmit, onBack }: { products: Product[]; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onBack: () => void }) {
  return <main className="page new-screen"><ScreenHeader eyebrow="CONTROL · ACTUALIZAR EXISTENCIAS" title="Entradas y salidas" subtitle="Registra un movimiento y el stock se actualizará automáticamente." onBack={onBack} /><section className="screen-card form-card"><div className="section-intro"><b>NUEVO MOVIMIENTO</b><span>Selecciona la prenda y la cantidad</span></div><MovementForm products={products} onSubmit={onSubmit} onCancel={onBack} /></section></main>;
}

function ProductDetail({ product, onBack, onMovement }: { product: Product; onBack: () => void; onMovement: () => void }) {
  const warning = product.stock <= product.minimum;
  return <main className="page new-screen"><ScreenHeader eyebrow={`INVENTARIO · ${product.code}`} title={product.name} subtitle="Consulta la información completa de esta referencia." onBack={onBack} /><section className="detail-layout"><div className="product-visual"><span>{product.name.slice(0, 1)}</span><small>REFERENCIA {product.code}</small></div><div className="screen-card detail-card"><div className="detail-status"><span className={warning ? "badge warning" : "badge"}>{product.stock === 0 ? "Agotado" : warning ? "Stock bajo" : product.status}</span><b>{product.stock} unidades</b></div><dl><div><dt>Nombre</dt><dd>{product.name}</dd></div><div><dt>Código</dt><dd>{product.code}</dd></div><div className="wide"><dt>Descripción</dt><dd>{product.description}</dd></div><div><dt>Talla</dt><dd>{product.size}</dd></div><div><dt>Color</dt><dd>{product.color}</dd></div><div><dt>Cantidad mínima</dt><dd>{product.minimum} unidades</dd></div><div><dt>Demanda</dt><dd>{product.demand} salidas</dd></div></dl><div className="detail-actions"><button onClick={onBack}>Volver al inventario</button><button onClick={onMovement}>Registrar movimiento</button></div></div></section></main>;
}

function ResultScreen({ type, onPrimary, onSecondary }: { type: "success" | "error"; onPrimary: () => void; onSecondary: () => void }) {
  const success = type === "success";
  return <main className="page new-screen result-page"><section className={`result-card ${type}`}><div className="result-icon"><Icon name={success ? "check" : "alert"} size={34} /></div><p>{success ? "REGISTRO COMPLETADO" : "ERROR DE VALIDACIÓN"}</p><h1>{success ? "Prenda registrada" : "Faltan datos obligatorios"}</h1><span>{success ? "La nueva referencia se agregó correctamente y ya está disponible en el inventario." : "Revisa el formulario y completa todos los campos antes de guardar la prenda."}</span><div className="result-actions"><button onClick={onSecondary}>{success ? "Registrar otra" : "Cancelar"}</button><button onClick={onPrimary}>{success ? "Ver inventario" : "Volver al formulario"}</button></div></section></main>;
}

function AlertsScreen({ products, onBack, onMovement }: { products: Product[]; onBack: () => void; onMovement: () => void }) {
  return <main className="page new-screen"><ScreenHeader eyebrow="CONTROL · REPOSICIÓN" title="Alertas de inventario" subtitle="Prendas que alcanzaron o descendieron de su cantidad mínima." onBack={onBack} /><section className="screen-card alerts-screen"><header><div><b>REPOSICIÓN NECESARIA</b><span>{products.length} referencias requieren atención</span></div><button onClick={onMovement}><Icon name="plus" /> Registrar entrada</button></header><div className="alert-grid">{products.map((product) => <article key={product.id}><div className="alert-product"><span><Icon name="alert" /></span><div><strong>{product.name}</strong><small>{product.code} · {product.size} · {product.color}</small></div></div><div className="stock-meter"><div><span>Stock actual</span><b>{product.stock}</b></div><i><span style={{ width: `${Math.min(100, product.minimum ? (product.stock / product.minimum) * 100 : 0)}%` }} /></i><small>Mínimo establecido: {product.minimum} unidades</small></div><button onClick={onMovement}>Reponer <Icon name="arrow" /></button></article>)}</div></section></main>;
}
