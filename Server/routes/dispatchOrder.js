const express = require("express");
const router = express.Router();
const getConnection = require("../db");


router.get("/customers", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT CUSTOMERID, CUSTOMERNAME FROM CUSTOMER ORDER BY CUSTOMERID`
        );

        let htmlString = '<option value="">Select Customer</option>';

        if (result.rows && result.rows.length > 0) {
            result.rows.forEach(row => {
                htmlString += `<option value="${row[0]}">${row[0]} - ${row[1]}</option>`;
            });
        }
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(htmlString);
    } 
    catch (err) {
        console.error(err);
        return res.status(500).send('<option value="">Error Loading Customers</option>');
    } 
    finally {
        if (connection) await connection.close();
    }
});


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
        return res.status(500).json({ message: "Pagination engine failure" });
    } finally {
        if (connection) await connection.close();
    }
});


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
        return res.status(500).json({ message: "Pagination engine failure" });
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;
