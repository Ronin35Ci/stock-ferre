const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456', 
    database: 'stock_ferre'
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Error al conectar a la base de datos stock_ferre:', err);
        return;
    }
    console.log('✅ ¡Conectado exitosamente a la base de datos stock_ferre!');
});

module.exports = connection;