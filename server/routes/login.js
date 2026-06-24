const express = require("express");
const router = express.Router();
const getConnection = require("../db");

router.post("/", async (req, res) => {
    const { username, password } = req.body;
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT ROLE 
             FROM USERS 
             WHERE USERNAME = :username 
             AND PASSWORD = :password 
             AND STATUS = 'ACTIVE'`,
            { username, password }
        );

        if (!result.rows || result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid Username or Password"
            });
        }

        const dbRole = result.rows[0][0];

        let redirectPath = ""; 
        if (dbRole === "ADMIN") redirectPath = "admin-dashboard.html";
        if (dbRole === "DISPATCHER") redirectPath = "dispatcher-dashboard.html";
        if (dbRole === "DRIVER") redirectPath = "driver-dashboard.html";

        res.json({
            success: true,
            role: dbRole,
            redirect: redirectPath
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (cErr) { console.error(cErr); }
        }
    }
});

module.exports = router;