const express = require("express");
const router = express.Router();
const getConnection = require("../db");

//new id
router.get("/new-id", async (req, res) => {

    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT NVL(MAX(CUSTOMERID), 0) + 1 FROM CUSTOMER`
        );

        res.json({ nextId: result.rows[0][0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error calculating sequence assignment parameters" });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

//next-id
router.get("/next/:id", async (req, res) => {

    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT CUSTOMERID, CUSTOMERNAME, ADDRESS, PHONE FROM CUSTOMER WHERE 
             CUSTOMERID = (SELECT MIN(CUSTOMERID) FROM CUSTOMER WHERE CUSTOMERID > :1)`,
            [req.params.id]
        );

        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "No more records found" });
        }
        const row = result.rows[0];

        res.json({
            customerId: row[0],
            customerName: row[1],
            customerAddress: row[2],
            customerPhone: row[3]
        });

    } catch (err) {

        console.error(err);
        res.status(500).json({ message: "Record lookup failed" });

    } finally {
        if (connection) {
            await connection.close();
        }
    }

});

//prev-id
router.get("/previous/:id", async (req, res) => {

    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT CUSTOMERID, CUSTOMERNAME, ADDRESS, PHONE FROM CUSTOMER WHERE
             CUSTOMERID = (SELECT MAX(CUSTOMERID) FROM CUSTOMER WHERE CUSTOMERID < :1)`,
            [req.params.id]
        );

        if (!result.rows || result.rows.length === 0) {

            return res.status(404).json({ success: false, message: "No more records found" });

        }

        const row = result.rows[0];

        res.json({
            customerId: row[0],
            customerName: row[1],
            customerAddress: row[2],
            customerPhone: row[3]
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({ message: "Record lookup failed" });

    } finally {
        if (connection) {
            await connection.close();
        }
    }

});

// get (fetch)
router.get("/:id", async (req, res) => {

    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT CUSTOMERNAME, ADDRESS, PHONE FROM CUSTOMER WHERE CUSTOMERID = :id`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Record not found" });
        }

        const row = result.rows[0];

        res.json({
            customerName: row[0],
            customerAddress: row[1],
            customerPhone: row[2]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Record lookup failed" });

    } finally {
        if (connection) {
            await connection.close();
        }
    }

});


//save
router.post("/", async (req, res) => {

    let connection;

    try {
        const { customerName, customerAddress, customerPhone } = req.body;

        connection = await getConnection();

        await connection.execute(
            `INSERT INTO CUSTOMER(CUSTOMERNAME, ADDRESS, PHONE) VALUES (:1, :2, :3)`, 
            [customerName, customerAddress, customerPhone],
            { autoCommit: true }
        );

        res.json({ success: true, message: "Customer Added Successfully" });

    } catch(err) {
        res.status(500).json({ success: false, message: "An error occurred during creation" });
    } finally {
        if (connection) {
            await connection.close();
        }

    }

});

//save
router.put("/:id", async (req, res) => {
    const { customerName, customerAddress, customerPhone } = req.body;

    let connection;

    try {

        connection = await getConnection();

        await connection.execute(
            `UPDATE CUSTOMER SET CUSTOMERNAME = :1, ADDRESS = :2, PHONE = :3 WHERE CUSTOMERID = :4`,
            [customerName, customerAddress, customerPhone, req.params.id],
            { autoCommit: true }
        );

        res.json({ success: true, message: `Customer updated with ID ${req.params.id}` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Record update transaction declined" });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

module.exports = router;