const express = require("express");
const router = express.Router();
const getConnection = require("../db");


router.get("/kpis", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(`
            SELECT
                (SELECT COUNT(*) FROM DISPATCHORDER WHERE UPPER(STATUS) = 'PENDING')   AS PENDING_COUNT,
                (SELECT COUNT(*) FROM DISPATCHORDER WHERE UPPER(STATUS) = 'DISPATCHED') AS TRANSIT_COUNT,
                (SELECT COUNT(*) FROM DISPATCHORDER WHERE UPPER(STATUS) = 'DELIVERED')  AS DELIVERED_COUNT
            FROM DUAL
        `);

        const row = result.rows[0];

        res.json({ pending: row[0], transit: row[1], completed: row[2] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to compute dashboard KPIs" });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});


router.get("/active-assignments", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(`
            SELECT a.ASSIGNMENTID, a.ORDERID, o.SOURCE, o.DESTINATION, o.STATUS,
                   d.DRIVERNAME, v.VEHICLENUMBER, TO_CHAR(a.ASSIGNEDDATE, 'YYYY-MM-DD')
            FROM DISPATCHASSIGNMENT a
            JOIN DISPATCHORDER o ON a.ORDERID = o.ORDERID
            JOIN DRIVER d ON a.DRIVERID = d.DRIVERID
            JOIN VEHICLE v ON a.VEHICLEID = v.VEHICLEID
            WHERE UPPER(o.STATUS) = 'DISPATCHED'
            ORDER BY a.ASSIGNMENTID DESC
        `);

        const assignments = result.rows.map((row) => ({
            assignmentId: row[0],
            orderId: row[1],
            source: row[2],
            destination: row[3],
            status: row[4],
            driverName: row[5],
            vehicleNumber: row[6],
            assignedDate: row[7],
        }));

        res.json(assignments);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to pull active assignment records" });

    } finally {
        if (connection) {
            await connection.close();
        }
    }

});


router.get("/pending-orders", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(`
            SELECT ORDERID, SOURCE, DESTINATION, TO_CHAR(DISPATCHDATE, 'YYYY-MM-DD')
            FROM DISPATCHORDER
            WHERE UPPER(STATUS) = 'PENDING'
            ORDER BY ORDERID DESC
        `);

        const orders = result.rows.map((row) => ({
            orderId: row[0],
            source: row[1],
            destination: row[2],
            dispatchDate: row[3],
        }));

        res.json(orders);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to pull unassigned order queue" });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});


//save
router.post("/deliver", async (req, res) => {

    let connection;

    const { orderId, deliveryDate, remarks, proofOfDelivery } = req.body;

    if (!orderId || !deliveryDate) {
        return res.status(400).json({ message: "Order ID and delivery date are required" });
    }

    try {

        connection = await getConnection();

        const orderCheck = await connection.execute(
            `SELECT STATUS FROM DISPATCHORDER WHERE ORDERID = :1`,
            [orderId]
        );

        if (!orderCheck.rows || orderCheck.rows.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (String(orderCheck.rows[0][0]).toUpperCase() === "DELIVERED") {
            return res.status(409).json({ message: "This order has already been settled as delivered" });
        }

        await connection.execute(
            `INSERT INTO DELIVERY (ORDERID, DELIVERYDATE, REMARKS, PROOFOFDELIVERY)
             VALUES (:1, TO_DATE(:2, 'YYYY-MM-DD'), :3, :4)`,
            [orderId, deliveryDate, remarks || null, proofOfDelivery || null],
            { autoCommit: false }
        );

        await connection.execute(
            `UPDATE DISPATCHORDER SET STATUS = 'Completed' WHERE ORDERID = :1`,
            [orderId],
            { autoCommit: false }
        );

        await connection.commit();

        res.json({ success: true, message: `Order ${orderId} settled as delivered successfully` });

    } catch (err) {
        console.error(err);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackErr) {
                console.error("Rollback failed:", rollbackErr);
            }
        }
        res.status(500).json({ message: "Failed to confirm delivery settlement" });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});


module.exports = router;