const modal = document.getElementById('modalProducto');
const btnNuevo = document.querySelector('.table-header .btn-primary');
const spanCerrar = document.querySelector('.close');
const formProducto = document.getElementById('formNuevoProducto');
const tablaProductos = document.querySelector('table tbody');


btnNuevo.addEventListener('click', function() {
    modal.style.display = 'flex';
});


spanCerrar.addEventListener('click', function() {
    modal.style.display = 'none';
});


window.addEventListener('click', function(event) {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});


formProducto.addEventListener('submit', async function(e) {
    e.preventDefault();

    const sku = document.getElementById('modalSku').value.trim();
    const nombre_producto = document.getElementById('modalNombre').value.trim();
    const categoria = document.getElementById('modalCategoria').value.trim();
    
    const precio_costo = Math.round(parseInt(document.getElementById('modalPrecio').value) * 0.7); 
    const precio_venta = parseInt(document.getElementById('modalPrecio').value);
    const stock_actual = parseInt(document.getElementById('modalStock').value);
    const stock_minimo = 5; // Stock mínimo por defecto para alertas

    const nuevoProducto = {
        sku,
        nombre_producto,
        categoria,
        precio_costo,
        precio_venta,
        stock_actual,
        stock_minimo
    };

    try {
        const respuesta = await fetch('/api/productos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoProducto)
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            alert("¡Producto registrado con éxito en la Base de Datos!");

            let estadoHTML = '';
            if (stock_actual <= stock_minimo) {
                estadoHTML = '<span class="badge warning">Crítico</span>';
            } else {
                estadoHTML = '<span class="badge ok">Normal</span>';
            }

            const nuevaFila = document.createElement('tr');
            nuevaFila.innerHTML = `
                <td>${sku}</td>
                <td>${nombre_producto}</td>
                <td>${categoria}</td>
                <td>$${precio_venta.toLocaleString('es-CL')}</td>
                <td>${stock_actual}</td>
                <td>${estadoHTML}</td>
            `;
            tablaProductos.appendChild(nuevaFila);

            formProducto.reset();
            modal.style.display = 'none';
        } else {
            alert("Error al registrar: " + resultado.message);
        }

    } catch (error) {
        console.error("Error de conexión con el servidor:", error);
        alert("No se pudo conectar con el servidor backend.");
    }
});