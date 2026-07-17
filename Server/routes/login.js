const express = require("express");
const oracledb = require("oracledb");
const router = express.Router();

const getConnection = require("../db");

router.post("/", async (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {

        return res.status(400).json({
            success: false,
            message: "Username, password are required"
        });
    }

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(
            `SELECT ROLE
             FROM USERS
             WHERE STATUS = 'ACTIVE'
             AND USERNAME = :username AND PASSWORD = :password`,
            { username, password },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {

            return res.json({
                success: false,
                message: "User does not exist"
            });
        }

        const user = result.rows[0];

        let redirect = "";


        if (user.ROLE === "ADMIN") {
            redirect = "/Web/admin-dashboard.html";
        }

        if (user.ROLE === "DRIVER") {
            redirect = "/Web/driver-dashboard.html";
        }

        if (user.ROLE === "DISPATCHER") {
            redirect = "/Web/dispatcher-dashboard.html";
        }

        return res.json({
            success: true,
            message: "Login successful",
            redirect
        });
    }

    catch(err) {

        console.error("Login route error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });

    } finally {

        if (connection) {
            await connection.close();
        }
    }

});


module.exports = router;
