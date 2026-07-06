const express = require("express");
const router = express.Router();
const getConnection = require("../db");

router.get("/orders", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT ORDERID FROM DISPATCHORDER`
        );

        let htmlString = '<option value="">Select Order</option>';

        if (result.rows && result.rows.length > 0) {

            result.rows.forEach(row => {
                htmlString += `<option value="${row[0]}">${row[0]}</option>`;
            });
        }
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(htmlString);
    } 
    catch (err) {
        console.error(err);
        return res.status(500).send('<option value="">Error Loading Options</option>');
    } 
    finally {
        if (connection) await connection.close();
    }
});


router.get("/drivers", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(`SELECT DRIVERID, DRIVERNAME FROM DRIVER ORDER BY DRIVERID`);

        let htmlString = '<option value="">Select Driver</option>';

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
        return res.status(500).send('<option value="">Error Loading Options</option>');
    } 
    finally {
        if (connection) await connection.close();
    }
});


router.get("/vehicles", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(`SELECT VEHICLEID, VEHICLETYPE FROM VEHICLE ORDER BY VEHICLEID`);

        let htmlString = '<option value="">Select Vehicle</option>';

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
        return res.status(500).send('<option value="">Error Loading Options</option>');
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
            `SELECT ASSIGNMENTID, ORDERID, DRIVERID, VEHICLEID, ASSIGNEDDATE FROM DISPATCHASSIGNMENT WHERE ASSIGNMENTID = :1`,
            [req.params.id]
        );

        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ message: "Record not found" });
        }

        const row = result.rows[0];
        res.json({
            assignmentId: row[0],
            orderId: row[1],
            driverId: row[2],
            vehicleId: row[3],
            assignedDate: row[4]
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
    const { orderId, driverId, vehicleId, dateTime } = req.body;

    try {
        connection = await getConnection();

        if (!dateTime || dateTime === "") {
            await connection.execute(
                `INSERT INTO DISPATCHASSIGNMENT (ORDERID, DRIVERID, VEHICLEID) VALUES (:1, :2, :3)`,
                [orderId, driverId, vehicleId],
                { autoCommit: true }
            );
        } else {
            await connection.execute(
                `INSERT INTO DISPATCHASSIGNMENT (ORDERID, DRIVERID, VEHICLEID, ASSIGNEDDATE) VALUES (:1, :2, :3, TO_DATE(:4, 'YYYY-MM-DD'))`,
                [orderId, driverId, vehicleId, dateTime],
                { autoCommit: true }
            );
        }

        res.json({ success: true, message: "Assignment transaction added successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Database creation decline" });
    } finally {
        if (connection) await connection.close();
    }
});


router.put("/:id", async (req, res) => {
    let connection;
    const { orderId, driverId, vehicleId, dateTime } = req.body;

    try {
        connection = await getConnection();

        if (!dateTime || dateTime === "") {
            await connection.execute(
                `UPDATE DISPATCHASSIGNMENT SET ORDERID = :1, DRIVERID = :2, VEHICLEID = :3 WHERE ASSIGNMENTID = :4`,
                [orderId, driverId, vehicleId, req.params.id],
                { autoCommit: true }
            );
        } else {
            await connection.execute(
                `UPDATE DISPATCHASSIGNMENT SET ORDERID = :1, DRIVERID = :2, VEHICLEID = :3, ASSIGNEDDATE = TO_DATE(:4, 'YYYY-MM-DD') WHERE ASSIGNMENTID = :5`,
                [orderId, driverId, vehicleId, dateTime, req.params.id],
                { autoCommit: true }
            );
        }

        res.json({ success: true, message: "Assignment transaction updated successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Database update decline" });
    } finally {
        if (connection) await connection.close();
    }
});


router.get("/next/:id", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT ASSIGNMENTID, ORDERID, DRIVERID, VEHICLEID, ASSIGNEDDATE FROM DISPATCHASSIGNMENT WHERE ASSIGNMENTID = (SELECT MIN(ASSIGNMENTID) FROM DISPATCHASSIGNMENT WHERE ASSIGNMENTID > :1)`,
            [req.params.id]
        );

        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ message: "No more sequential records found" });
        }

        const row = result.rows[0];
        res.json({
            assignmentId: row[0],
            orderId: row[1],
            driverId: row[2],
            vehicleId: row[3],
            assignedDate: row[4]
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
            `SELECT ASSIGNMENTID, ORDERID, DRIVERID, VEHICLEID, ASSIGNEDDATE FROM DISPATCHASSIGNMENT WHERE ASSIGNMENTID = (SELECT MAX(ASSIGNMENTID) FROM DISPATCHASSIGNMENT WHERE ASSIGNMENTID < :1)`,
            [req.params.id]
        );

        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ message: "No prior sequential records found" });
        }

        const row = result.rows[0];
        res.json({
            assignmentId: row[0],
            orderId: row[1],
            driverId: row[2],
            vehicleId: row[3],
            assignedDate: row[4]
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Pagination engine failure" });
    } finally {
        if (connection) await connection.close();
    }
});



module.exports = router;