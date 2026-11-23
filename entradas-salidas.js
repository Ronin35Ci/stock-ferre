document.getElementById('formEntrada').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const producto = document.getElementById('prodEntrada').value;
    const cantidad = document.getElementById('cantEntrada').value;
    const proveedor = document.getElementById('provEntrada').value;
    const fechaHora = new Date().toLocaleString();

    const tablaMovimientos = document.getElementById('tablaMovimientos');
    const nuevaFila = document.createElement('tr');
    
    nuevaFila.innerHTML = `
        <td>${fechaHora}</td>
        <td><span class="badge ok">ENTRADA</span></td>
        <td>${producto}</td>
        <td>+${cantidad}</td>
        <td>Compra proveedor (${proveedor})</td>
    `;

    tablaMovimientos.insertBefore(nuevaFila, tablaMovimientos.firstChild);
    document.getElementById('formEntrada').reset();
    alert("¡Entrada de stock registrada correctamente!");
});


document.getElementById('formSalida').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const producto = document.getElementById('prodSalida').value;
    const cantidad = document.getElementById('cantSalida').value;
    const motivo = document.getElementById('motivoSalida').value;
    const fechaHora = new Date().toLocaleString();

    const tablaMovimientos = document.getElementById('tablaMovimientos');
    const nuevaFila = document.createElement('tr');
    
    nuevaFila.innerHTML = `
        <td>${fechaHora}</td>
        <td><span class="badge warning">SALIDA</span></td>
        <td>${producto}</td>
        <td>-${cantidad}</td>
        <td>${motivo === 'Venta' ? 'Venta en Mesón' : 'Merma / Producto Dañado'}</td>
    `;

    tablaMovimientos.insertBefore(nuevaFila, tablaMovimientos.firstChild);
    document.getElementById('formSalida').reset();
    alert("¡Salida de stock registrada correctamente!");
});