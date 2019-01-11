module.exports = {
    development: {
        server_host: 'localhost',
        server_port_http: '8080',
        username: 'gluser2018',
        password: 'glpass2018',
        database: 'intoTheWoodsDB',
        host: 'localhost',
        dialect: 'mysql',
        logging: true, // True for logging sequelize message
        no_login: false,
        define: {
            timestamps: false
        }
    },
    production: {
        server_host: 'intothewoods.runtonic.ovh',
        server_port_http: '80',
        server_port_https: '443',
        username: 'gluser2018',
        password: 'glpass2018',
        database: 'intoTheWoodsDB',
        host: 'localhost',
        dialect: 'mysql',
        logging: false,
        no_login: false,
        define: {
            timestamps: false
        }
    },
    mail: {
        service: "gmail",
        login: "intothewoods.app@gmail.com",
        password: "jdburdrqdlqcocrh" // Application password
    }
};
