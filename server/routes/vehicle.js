const express = require("express");
const router = express.Router();

const getConnection = require("../db");


// ADD VEHICLE

router.post("/", async (req, res) => {

    try {

        const {
            vehicleNumber,
            vehicleType,
            capacity
        } = req.body;

        const conn = await getConnection();

        await conn.execute(

            `INSERT INTO VEHICLE
            (
                VEHICLENUMBER,
                VEHICLETYPE,
                CAPACITY
            )
            VALUES
            (
                :1,
                :2,
                :3
            )`,

            [
                vehicleNumber,
                vehicleType,
                capacity
            ],

            {
                autoCommit: true
            }

        );

        await conn.close();

        res.json({
            success: true,
            message: "Vehicle Added"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Insert Failed"
        });

    }

});


// FETCH VEHICLE BY ID

router.get("/:id", async (req, res) => {

    try {

        const conn = await getConnection();

        const result = await conn.execute(

            `SELECT
                VEHICLEID,
                VEHICLENUMBER,
                VEHICLETYPE,
                CAPACITY
             FROM VEHICLE
             WHERE VEHICLEID = :id`,

            [req.params.id]

        );

        await conn.close();

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Vehicle Not Found"
            });

        }

        const row = result.rows[0];

        res.json({
            vehicleId: row[0],
            vehicleNumber: row[1],
            vehicleType: row[2],
            capacity: row[3]
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Fetch Failed"
        });

    }

});


// UPDATE VEHICLE

router.put("/:id", async (req, res) => {

    try {

        const {
            vehicleNumber,
            vehicleType,
            capacity
        } = req.body;

        const conn = await getConnection();

        await conn.execute(

            `UPDATE VEHICLE
             SET
                VEHICLENUMBER = :1,
                VEHICLETYPE   = :2,
                CAPACITY      = :3
             WHERE VEHICLEID = :4`,

            [
                vehicleNumber,
                vehicleType,
                capacity,
                req.params.id
            ],

            {
                autoCommit: true
            }

        );

        await conn.close();

        res.json({
            success: true,
            message: "Vehicle Updated"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Update Failed"
        });

    }

});


// DELETE VEHICLE

router.delete("/:id", async (req, res) => {

    try {

        const conn = await getConnection();

        await conn.execute(

            `DELETE
             FROM VEHICLE
             WHERE VEHICLEID = :id`,

            [req.params.id],

            {
                autoCommit: true
            }

        );

        await conn.close();

        res.json({
            success: true,
            message: "Vehicle Deleted"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Delete Failed"
        });

    }

});


// VIEW ALL VEHICLES

router.get("/", async (req, res) => {

    try {

        const conn = await getConnection();

        const result = await conn.execute(

            `SELECT
                VEHICLEID,
                VEHICLENUMBER,
                VEHICLETYPE,
                CAPACITY
             FROM VEHICLE
             ORDER BY VEHICLEID`

        );

        await conn.close();

        const vehicles = result.rows.map(row => ({
            vehicleId: row[0],
            vehicleNumber: row[1],
            vehicleType: row[2],
            capacity: row[3]
        }));

        res.json(vehicles);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Fetch Failed"
        });

    }

});

module.exports = router;