const oracledb = require('oracledb');

async function getConnection() {
    try {
        return await oracledb.getConnection({
            user: "shipxpress",
            password: "shipxpress",
            connectString: "localhost:1521/FREEPDB1"
        })
    }
    catch(err) {
        console.error("Error connecting to database: ", err);
    }
};

module.exports = getConnection;
