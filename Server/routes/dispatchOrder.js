const express = require("express");
const router = express.Router();
const getConnection = require("../db");


// ── Get next available Order ID (mirrors vehicle next-id) ──
router.get("/next-id", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT NVL(MAX(ORDERID), 0) + 1 FROM DISPATCHORDER`
        );
        const nextId = result.rows && result.rows[0] ? result.rows[0][0] : 1;
        res.json({ nextId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Unable to get next Order ID" });
    } finally {
        if (connection) await connection.close();
    }
});


// ── Load DispatchOrderStatus values from LOV table ──
router.get("/statuses", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT LOV_VALUE FROM LOV_Master
              WHERE LOV_TYPE = 'DispatchOrderStatus'
                AND STATUS   = 'ACTIVE'
              ORDER BY LOV_ID`
        );
        const statuses = (result.rows || []).map(row => row[0]);
        res.json(statuses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Unable to fetch dispatch order statuses" });
    } finally {
        if (connection) await connection.close();
    }
});


router.get("/customers", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT CUSTOMERID, CUSTOMERNAME FROM CUSTOMER ORDER BY CUSTOMERID`
        );

        const customers = (result.rows || []).map(row => ({
            customerId  : row[0],
            customerName: row[1]
        }));

        res.json(customers);
    } 
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error Loading Customers" });
    } 
    finally {
        if (connection) await connection.close();
    }
});


// ── Get next record ── (must be before /:id)
router.get("/next/:id", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT ORDERID, CUSTOMERID, DISPATCHDATE, SOURCE, DESTINATION, STATUS FROM DISPATCHORDER WHERE ORDERID = (SELECT MIN(ORDERID) FROM DISPATCHORDER WHERE ORDERID > :1)`,
            [req.params.id]
        );
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ message: "No more sequential records found" });
        }
        const row = result.rows[0];
        res.json({ orderId: row[0], customerId: row[1], dispatchDate: row[2], source: row[3], destination: row[4], status: row[5] });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Pagination engine failure" });
    } finally {
        if (connection) await connection.close();
    }
});


// ── Get previous record ──
router.get("/previous/:id", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT ORDERID, CUSTOMERID, DISPATCHDATE, SOURCE, DESTINATION, STATUS FROM DISPATCHORDER WHERE ORDERID = (SELECT MAX(ORDERID) FROM DISPATCHORDER WHERE ORDERID < :1)`,
            [req.params.id]
        );
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ message: "No prior sequential records found" });
        }
        const row = result.rows[0];
        res.json({ orderId: row[0], customerId: row[1], dispatchDate: row[2], source: row[3], destination: row[4], status: row[5] });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Pagination engine failure" });
    } finally {
        if (connection) await connection.close();
    }
});


// ── Get by ID ──
router.get("/:id", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT ORDERID, CUSTOMERID, DISPATCHDATE, SOURCE, DESTINATION, STATUS FROM DISPATCHORDER WHERE ORDERID = :1`,
            [req.params.id]
        );

        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ message: "Record not found" });
        }

        const row = result.rows[0];
        res.json({
            orderId: row[0],
            customerId: row[1],
            dispatchDate: row[2],
            source: row[3],
            destination: row[4],
            status: row[5]
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database connection failure" });
    } finally {
        if (connection) await connection.close();
    }
});


router.post("/", async (req, res) => {
    let connection;
    const { customerId, source, destination, dispatchDate, status } = req.body;

    try {
        connection = await getConnection();

        
        const customerCheck = await connection.execute(
            `SELECT CUSTOMERID FROM CUSTOMER WHERE CUSTOMERID = :1`,
            [customerId]
        );

        if (!customerCheck.rows || customerCheck.rows.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid Customer ID - Customer does not exist" 
            });
        }

        
        if (!source || !destination) {
            return res.status(400).json({ 
                success: false, 
                message: "Source and Destination are required" 
            });
        }

        
        if (!dispatchDate || dispatchDate === "") {
            await connection.execute(
                `INSERT INTO DISPATCHORDER (CUSTOMERID, SOURCE, DESTINATION, STATUS) VALUES (:1, :2, :3, :4)`,
                [customerId, source, destination, status || 'Pending'],
                { autoCommit: true }
            );
        } else {
            await connection.execute(
                `INSERT INTO DISPATCHORDER (CUSTOMERID, SOURCE, DESTINATION, DISPATCHDATE, STATUS) VALUES (:1, :2, :3, TO_DATE(:4, 'YYYY-MM-DD'), :5)`,
                [customerId, source, destination, dispatchDate, status || 'Pending'],
                { autoCommit: true }
            );
        }

        res.json({ 
            success: true, 
            message: "Dispatch Order created successfully" 
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ 
            success: false, 
            message: "Database creation failed" 
        });
    } finally {
        if (connection) await connection.close();
    }
});


router.put("/:id", async (req, res) => {
    let connection;
    const { customerId, source, destination, dispatchDate, status } = req.body;

    try {
        connection = await getConnection();

        
        const customerCheck = await connection.execute(
            `SELECT CUSTOMERID FROM CUSTOMER WHERE CUSTOMERID = :1`,
            [customerId]
        );

        if (!customerCheck.rows || customerCheck.rows.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid Customer ID - Customer does not exist" 
            });
        }

        
        if (!source || !destination) {
            return res.status(400).json({ 
                success: false, 
                message: "Source and Destination are required" 
            });
        }

        
        if (!dispatchDate || dispatchDate === "") {
            await connection.execute(
                `UPDATE DISPATCHORDER SET CUSTOMERID = :1, SOURCE = :2, DESTINATION = :3, STATUS = :4 WHERE ORDERID = :5`,
                [customerId, source, destination, status || 'Pending', req.params.id],
                { autoCommit: true }
            );
        } else {
            await connection.execute(
                `UPDATE DISPATCHORDER SET CUSTOMERID = :1, SOURCE = :2, DESTINATION = :3, DISPATCHDATE = TO_DATE(:4, 'YYYY-MM-DD'), STATUS = :5 WHERE ORDERID = :6`,
                [customerId, source, destination, dispatchDate, status || 'Pending', req.params.id],
                { autoCommit: true }
            );
        }

        res.json({ 
            success: true, 
            message: "Dispatch Order updated successfully" 
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ 
            success: false, 
            message: "Database update failed" 
        });
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;
