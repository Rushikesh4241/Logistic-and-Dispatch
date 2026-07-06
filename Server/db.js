const oracledb = require('oracledb');

oracledb.initOracleClient({
  libDir: 'C:\\oracleinstantclient\\instantclient_21_22'
});

async function getConnection() {
  try {
    return await oracledb.getConnection({
      user: "dhruv",
      password: "dhruv",
      connectString: "localhost:1521/XE"
    });
  } catch (err) {
    console.error("Error connecting to database: ", err);
    throw err;
  }
}

module.exports = getConnection;