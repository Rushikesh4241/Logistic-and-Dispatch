const express = require("express");
const router = express.Router();
const getConnection = require("../db");


router.get("/new-id", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT NVL(MAX(DRIVERID), 0) + 1 FROM DRIVER`
        );
        res.json({ nextId: result.rows[0][0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error calculating sequence assignment parameters" });
    } finally {
        if (connection) await connection.close();
    }
});

// GET NEXT RECORD
router.get("/next/:id", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT DRIVERID, DRIVERNAME, PHONE, LICENSENUMBER FROM DRIVER WHERE 
             DRIVERID = (SELECT MIN(DRIVERID) FROM DRIVER WHERE DRIVERID > :1)`,
            [req.params.id]
        );

        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "No more records found" });
        }

        const row = result.rows[0];
        res.json({
            driverId: row[0],
            driverName: row[1],
            driverPhone: row[2],
            licenseNumber: row[3]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Record lookup failed" });
    } finally {
        if (connection) await connection.close();
    }
});

// GET PREVIOUS RECORD
router.get("/previous/:id", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT DRIVERID, DRIVERNAME, PHONE, LICENSENUMBER FROM DRIVER WHERE
             DRIVERID = (SELECT MAX(DRIVERID) FROM DRIVER WHERE DRIVERID < :1)`,
            [req.params.id]
        );

        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "No more records found" });
        }

        const row = result.rows[0];
        res.json({
            driverId: row[0],
            driverName: row[1],
            driverPhone: row[2],
            licenseNumber: row[3]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Record lookup failed" });
    } finally {
        if (connection) await connection.close();
    }
});


// GET BY INDIVIDUAL CUSTOMER ID
router.get("/:id", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT DRIVERID, DRIVERNAME, PHONE, LICENSENUMBER FROM DRIVER WHERE DRIVERID = :id`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Record not found" });
        }

        const row = result.rows[0];
        res.json({
            driverName: row[0],
            driverPhone: row[1],
            licenseNumber: row[2]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Record lookup failed" });
    } finally {
        if (connection) await connection.close();
    }
});

// POST (INSERT NEW CUSTOMER)
router.post("/", async (req, res) => {
    let connection;
    try {
        const { driverName, driverPhone, licenseNumber } = req.body;
        connection = await getConnection();
        await connection.execute(
            `INSERT INTO DRIVER(DRIVERNAME, PHONE,LICENSENUMBER) VALUES (:1, :2, :3)`, 
            [driverName, driverPhone, licenseNumber],
            { autoCommit: true }
        );
        res.json({ success: true, message: "Driver Added Successfully" });
    } catch(err) {
        res.status(500).json({ success: false, message: "An error occurred during creation" });
    } finally {
        if (connection) await connection.close();
    }
});

// PUT (UPDATE EXISTING CUSTOMER)
router.put("/:id", async (req, res) => {
    const { driverName, driverPhone, licenseNumber } = req.body;
    let connection;
    try {
        connection = await getConnection();
        await connection.execute(
            `UPDATE DRIVER SET DRIVERNAME = :1, PHONE = :2, LICENSENUMBER = :3 WHERE DRIVERID = :4`,
            [driverName, driverPhone, licenseNumber, req.params.id],
            { autoCommit: true }
        );
        res.json({ success: true, message: `Driver updated with ID ${req.params.id}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Record update transaction declined" });
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;
