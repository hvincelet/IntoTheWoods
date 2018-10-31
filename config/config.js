module.exports = {
    development: {
        username: 'gluser2018',
        password: 'glpass2018',
        database: 'intoTheWoodsDB',
        host: 'localhost',
        dialect: 'mysql',
        logging: false, // True for logging sequelize message
        no_login: true,
        define: {
            timestamps: false
        }
    },
    production: {
        // configuration dedicated to the production environment
    },
    mail: {
        service: "gmail",
        login: "intothewoods.app@gmail.com",
        password: "jdburdrqdlqcocrh"
    }
};