const express = require('express');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));

app.get('/api/productos', (req, res) => {
    const query = 'SELECT * FROM productos';
    db.query(query, (err, resultados) => {
        if (err) {
            console.error('❌ Error al obtener productos:', err);
            return res.status(500).json({ success: false, message: 'Error al consultar la base de datos.' });
        }
        res.json(resultados);
    });
});

app.post('/api/productos', (req, res) => {
    const { sku, nombre_producto, categoria, precio_costo, precio_venta, stock_actual, stock_minimo } = req.body;
    const skuLimpio = (sku || '').trim().toUpperCase();
    const stockNum = parseInt(stock_actual, 10) || 0;

    const buscarQuery = 'SELECT id_producto, stock_actual FROM productos WHERE UPPER(TRIM(sku)) = ?';

    db.query(buscarQuery, [skuLimpio], (err, rows) => {
        if (err) {
            console.error('❌ Error al buscar producto:', err);
            return res.status(500).json({ success: false, message: 'Error al consultar la base de datos.' });
        }

        if (rows.length > 0) {
            const nuevoStock = rows[0].stock_actual + stockNum;
            const updateQuery = `
                UPDATE productos 
                SET stock_actual = ?, precio_venta = ?, precio_costo = ?, categoria = ?, nombre_producto = ?
                WHERE id_producto = ?
            `;

            db.query(updateQuery, [nuevoStock, precio_venta, precio_costo, categoria, nombre_producto, rows[0].id_producto], (updateErr) => {
                if (updateErr) {
                    console.error('❌ Error al actualizar stock:', updateErr);
                    return res.status(500).json({ success: false, message: 'Error al actualizar el stock del producto.' });
                }

                return res.json({
                    success: true,
                    updated: true,
                    stock_actual: nuevoStock,
                    message: `✅ Producto ${skuLimpio} ya existía: stock actualizado a ${nuevoStock} unidades.`
                });
            });
        } else {
            const insertQuery = 'INSERT INTO productos (sku, nombre_producto, categoria, precio_costo, precio_venta, stock_actual, stock_minimo) VALUES (?, ?, ?, ?, ?, ?, ?)';

            db.query(insertQuery, [skuLimpio, nombre_producto, categoria, precio_costo, precio_venta, stockNum, stock_minimo], (insertErr, result) => {
                if (insertErr) {
                    console.error('❌ Error al registrar producto:', insertErr);
                    return res.status(500).json({ success: false, message: 'Error al registrar el producto en la base de datos.' });
                }

                return res.json({
                    success: true,
                    updated: false,
                    stock_actual: stockNum,
                    message: '✅ ¡Producto registrado exitosamente!',
                    id: result.insertId
                });
            });
        }
    });
});

app.delete('/api/productos/:sku', (req, res) => {
    const skuLimpio = (req.params.sku || '').trim().toUpperCase();
    const query = 'DELETE FROM productos WHERE UPPER(TRIM(sku)) = ?';

    db.query(query, [skuLimpio], (err, result) => {
        if (err) {
            console.error('❌ Error al eliminar producto:', err);
            return res.status(500).json({ success: false, message: 'Error al eliminar el producto de la base de datos.' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado en la base de datos.' });
        }

        res.json({ success: true, message: '✅ ¡Producto eliminado exitosamente de la Base de Datos!' });
    });
});

app.get('/api/ordenes-compra', (req, res) => {
    const query = 'SELECT * FROM ordenes_compra ORDER BY id_orden DESC';
    db.query(query, (err, resultados) => {
        if (err) {
            console.error('❌ Error al obtener órdenes de compra:', err);
            return res.status(500).json({ success: false, message: 'Error al consultar órdenes de compra.' });
        }
        res.json(resultados);
    });
});

app.post('/api/ordenes-compra', (req, res) => {
    const { numeroOC, sku, nombreProducto, cantidad, proveedor, estado } = req.body;
    const skuLimpio = (sku || '').trim().toUpperCase();
    const cantNum = parseInt(cantidad, 10) || 0;

    const query = `
        INSERT INTO ordenes_compra (numero_oc, sku, nombre_producto, cantidad_solicitada, proveedor, estado)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [numeroOC, skuLimpio, nombreProducto, cantNum, proveedor, estado || 'Pendiente de Envío'], (err, result) => {
        if (err) {
            console.error('❌ Error al crear orden de compra:', err);
            return res.status(500).json({ success: false, message: 'Error al guardar la orden de compra.' });
        }
        res.json({ success: true, id: result.insertId, message: '✅ Orden de compra guardada en base de datos.' });
    });
});

app.put('/api/ordenes-compra/:numeroOC/recibir', (req, res) => {
    const numeroOC = req.params.numeroOC;
    const { sku, cantidad } = req.body;
    const cantNum = parseInt(cantidad, 10) || 0;

    const buscarOrdenQuery = 'SELECT sku, nombre_producto, cantidad_solicitada, estado FROM ordenes_compra WHERE numero_oc = ?';

    db.query(buscarOrdenQuery, [numeroOC], (err, rows) => {
        if (err) {
            console.error('❌ Error al buscar orden de compra:', err);
            return res.status(500).json({ success: false, message: 'Error al consultar la orden de compra.' });
        }

        const orden = rows.length > 0 ? rows[0] : null;
        if (orden && (orden.estado === 'Recibida' || orden.estado === 'Emitida / Recibida')) {
            return res.json({ success: true, yaRecibida: true, message: '✅ La orden ya se encontraba recibida.' });
        }

        const skuFinal = (orden ? orden.sku : sku || '').trim().toUpperCase();
        const nombreFinal = orden && orden.nombre_producto ? orden.nombre_producto : skuFinal;
        const cantidadFinal = orden ? parseInt(orden.cantidad_solicitada, 10) : cantNum;

        const actualizarOrdenQuery = 'UPDATE ordenes_compra SET estado = ? WHERE numero_oc = ?';
        db.query(actualizarOrdenQuery, ['Recibida', numeroOC], (updErr) => {
            if (updErr) {
                console.error('❌ Error al actualizar estado de OC:', updErr);
                return res.status(500).json({ success: false, message: 'Error al actualizar estado de la orden.' });
            }

            if (!skuFinal || cantidadFinal <= 0) {
                return res.json({ success: true, message: '✅ Orden marcada como recibida.' });
            }

            const buscarProductoQuery = 'SELECT id_producto, stock_actual FROM productos WHERE UPPER(TRIM(sku)) = ?';
            db.query(buscarProductoQuery, [skuFinal], (prodErr, prodRows) => {
                if (prodErr) {
                    console.error('❌ Error al buscar producto:', prodErr);
                    return res.status(500).json({ success: false, message: 'Error al consultar productos.' });
                }

                if (prodRows.length > 0) {
                    const nuevoStock = prodRows[0].stock_actual + cantidadFinal;
                    const sumarStockQuery = 'UPDATE productos SET stock_actual = ? WHERE id_producto = ?';
                    db.query(sumarStockQuery, [nuevoStock, prodRows[0].id_producto], (stockErr) => {
                        if (stockErr) {
                            console.error('❌ Error al sumar stock desde OC:', stockErr);
                            return res.status(500).json({ success: false, message: 'Error al sumar stock en productos.' });
                        }

                        return res.json({
                            success: true,
                            creado: false,
                            stock_actual: nuevoStock,
                            message: `✅ Orden ${numeroOC} recibida y stock actualizado a ${nuevoStock} en ${skuFinal}.`
                        });
                    });
                } else {
                    const insertProductoQuery = `
                        INSERT INTO productos (sku, nombre_producto, categoria, precio_costo, precio_venta, stock_actual, stock_minimo)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `;
                    db.query(
                        insertProductoQuery,
                        [skuFinal, nombreFinal, 'General', 0, 0, cantidadFinal, 5],
                        (insertErr) => {
                            if (insertErr) {
                                console.error('❌ Error al crear producto desde OC:', insertErr);
                                return res.status(500).json({ success: false, message: 'Error al crear producto desde la orden.' });
                            }

                            return res.json({
                                success: true,
                                creado: true,
                                stock_actual: cantidadFinal,
                                message: `✅ Producto ${skuFinal} creado y stock ingresado (${cantidadFinal} u.).`
                            });
                        }
                    );
                }
            });
        });
    });
});

app.put('/api/productos/ajustar-stock', (req, res) => {
    const { sku, cantidad, operacion } = req.body;
    const skuLimpio = (sku || '').trim().toUpperCase();
    const cantNum = parseInt(cantidad, 10) || 0;

    if (!skuLimpio || cantNum <= 0) {
        return res.status(400).json({ success: false, message: 'SKU y cantidad válida son requeridos.' });
    }

    const buscarQuery = 'SELECT id_producto, stock_actual FROM productos WHERE UPPER(TRIM(sku)) = ?';
    db.query(buscarQuery, [skuLimpio], (err, rows) => {
        if (err) {
            console.error('❌ Error al consultar producto:', err);
            return res.status(500).json({ success: false, message: 'Error al consultar la base de datos.' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: `Producto ${skuLimpio} no encontrado en inventario.` });
        }

        const stockActual = parseInt(rows[0].stock_actual, 10) || 0;
        const nuevoStock = operacion === 'restar'
            ? Math.max(0, stockActual - cantNum)
            : stockActual + cantNum;

        const updateQuery = 'UPDATE productos SET stock_actual = ? WHERE id_producto = ?';
        db.query(updateQuery, [nuevoStock, rows[0].id_producto], (updErr) => {
            if (updErr) {
                console.error('❌ Error al ajustar stock:', updErr);
                return res.status(500).json({ success: false, message: 'Error al actualizar el stock.' });
            }

            return res.json({
                success: true,
                sku: skuLimpio,
                stock_actual: nuevoStock,
                message: `✅ Stock de ${skuLimpio} actualizado a ${nuevoStock} unidades.`
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
