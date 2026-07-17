const express = require("express");
const router = express.Router();
const getConnection = require("../db");

// fetch orders
router.get("/orders", async (req, res) => {

    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT ORDERID FROM DISPATCHORDER ORDER BY ORDERID`
        );

        const orderIds = result.rows.map((row) => ({ ORDERID: row[0] }));
        res.json(orderIds);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to load order IDs" });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});


//next id
router.get("/next-id", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(
            `SELECT NVL(MAX(DELIVERYID), 0) + 1 AS NEXTID FROM DELIVERY`
        );

        const nextId = result.rows[0][0];
        res.json({ nextDeliveryId: nextId });

    } catch (err) {

        console.error(err);
        res.status(500).json({ message: "Failed to calculate next delivery ID" });

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
            `SELECT DELIVERYID, ORDERID, DELIVERYDATE, REMARKS, PROOFOFDELIVERY
             FROM DELIVERY
             WHERE DELIVERYID = :1`,
            [req.params.id]
        );


        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ message: "Delivery not found" });
        }

        const row = result.rows[0];

        res.json({
            deliveryId: row[0],
            orderId: row[1],
            deliveryDate: row[2],
            remarks: row[3],
            proofOfDelivery: row[4]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to load delivery" });

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
            `SELECT DELIVERYID, ORDERID, DELIVERYDATE, REMARKS, PROOFOFDELIVERY FROM DELIVERY WHERE
             DELIVERYID = (SELECT MIN(DELIVERYID) FROM DELIVERY WHERE DELIVERYID > :1)`,
            [req.params.id]
        );

        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "No more records found" });
        }

        const row = result.rows[0];

        res.json({
            deliveryId: row[0],
            orderId: row[1],
            deliveryDate: row[2],
            remarks: row[3],
            proofOfDelivery: row[4]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Record not found" });

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
            `SELECT DELIVERYID, ORDERID, DELIVERYDATE, REMARKS, PROOFOFDELIVERY FROM DELIVERY WHERE
             DELIVERYID = (SELECT MAX(DELIVERYID) FROM DELIVERY WHERE DELIVERYID < :1)`,
            [req.params.id]
        );

        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "No more records found" });
        }

        const row = result.rows[0];

        res.json({
            deliveryId: row[0],
            orderId: row[1],
            deliveryDate: row[2],
            remarks: row[3],
            proofOfDelivery: row[4]
        });

    } catch (err) {

        console.error(err);
        res.status(500).json({ message: "Record not found" });

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
        const { deliveryId, orderId, deliveryDate, remarks, proofOfDelivery } = req.body;

        connection = await getConnection();

        const nextIdResult = await connection.execute(
            `SELECT NVL(MAX(DELIVERYID), 0) + 1 AS NEXTID FROM DELIVERY`
        );

        const effectiveDeliveryId = deliveryId && String(deliveryId).trim() !== ""
            ? Number(deliveryId)
            : nextIdResult.rows[0][0];

        const dateValue = deliveryDate && String(deliveryDate).trim() ? deliveryDate : null;

        let insertSQL;

        let params;

        if (dateValue) {

            insertSQL = `INSERT INTO DELIVERY(DELIVERYID, ORDERID, DELIVERYDATE, REMARKS, PROOFOFDELIVERY)
                         VALUES (:1, :2, TO_DATE(:3, 'YYYY-MM-DD'), :4, :5)`;

            params = [effectiveDeliveryId, orderId, dateValue, remarks || null, proofOfDelivery || null];

        } else {

            insertSQL = `INSERT INTO DELIVERY(DELIVERYID, ORDERID, DELIVERYDATE, REMARKS, PROOFOFDELIVERY)
                         VALUES (:1, :2, SYSDATE, :3, :4)`;

            params = [effectiveDeliveryId, orderId, remarks || null, proofOfDelivery || null];
        }

        await connection.execute(insertSQL, params, { autoCommit: true });

        res.json({
            success: true,
            message: "Delivery Added"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Insert Failed"
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }

});

//update
router.put("/:id", async (req, res) => {

    let connection;

    try {

        const { orderId, deliveryDate, remarks, proofOfDelivery } = req.body;

        connection = await getConnection();

        const dateValue = deliveryDate && String(deliveryDate).trim() ? deliveryDate : null;

        const params = dateValue
            ? [orderId, dateValue, remarks || null, proofOfDelivery || null, req.params.id]
            : [orderId, remarks || null, proofOfDelivery || null, req.params.id];

        const updateSQL = dateValue
            ? `UPDATE DELIVERY
               SET ORDERID = :1,
                   DELIVERYDATE = TO_DATE(:2, 'YYYY-MM-DD'),
                   REMARKS = :3,
                   PROOFOFDELIVERY = :4
               WHERE DELIVERYID = :5`
            : `UPDATE DELIVERY
               SET ORDERID = :1,
                   REMARKS = :2,
                   PROOFOFDELIVERY = :3
               WHERE DELIVERYID = :4`;

        const result = await connection.execute(updateSQL, params, { autoCommit: true });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, message: "Delivery not found" });
        }

        res.json({
            success: true,
            message: "Delivery Updated"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Update Failed" });

    } finally {

        if (connection) {
            await connection.close();
        }
    }
});

module.exports = router;
