module.exports = {
    development: {
        username: 'gluser2018',
        password: 'glpass2018',
        database: 'intoTheWoodsDB',
        host: 'localhost',
        dialect: 'mysql',
        define: {
            timestamps: false
        }
    },
    production: {
        // configuration dedicated to the production environment
    }
};