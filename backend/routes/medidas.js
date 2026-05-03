const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post("/medidas", async (req, res) => {
    try {
        const { id_usuario, temperatura } = req.body;

        if (!id_usuario || temperatura === undefined) {
            return res.status(400).json({
                success: false,
                message: "Datos incompletos"
            });
        }

        if (isNaN(temperatura)) {
            return res.status(400).json({
                success: false,
                message: "Temperatura inválida"
            });
        }

        const result = await pool.query(`
            SELECT COUNT(*) 
            FROM medidas 
            WHERE id_usuario = $1 
            AND DATE(fecha) = CURRENT_DATE
        `, [id_usuario]);

        const totalHoy = parseInt(result.rows[0].count);

        if (totalHoy >= 3) {
            return res.json({
                success: false,
                message: "Máximo de 3 mediciones por día alcanzado"
            });
        }

        // INSERT medida
        await pool.query(`
            INSERT INTO medidas (id_usuario, temperatura)
            VALUES ($1, $2)
        `, [id_usuario, temperatura]);

        //  ALERTA 
        if (temperatura >= 37.5) {
            await pool.query(`
                INSERT INTO alertas (id_usuario, temperatura, mensaje)
                VALUES ($1, $2, $3)
            `, [
                id_usuario,
                temperatura,
                "Paciente con posible fiebre"
            ]);
        }

        res.json({
            success: true,
            message: "Medida registrada correctamente"
        });

    } catch (error) {
        console.error("ERROR MEDIDAS:", error);
        res.status(500).json({
            success: false,
            message: "Error en el servidor"
        });
    }
});


/* ───────────── GET HISTORIAL ───────────── */

router.get("/medidas/:id_usuario", async (req, res) => {
    try {
        const { id_usuario } = req.params;

        const result = await pool.query(`
      SELECT 
        id_medida,
        temperatura,
        fecha
      FROM medidas
      WHERE id_usuario = $1
      ORDER BY fecha DESC
    `, [id_usuario]);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error("ERROR GET MEDIDAS:", error);
        res.status(500).json({
            success: false,
            message: "Error obteniendo historial"
        });
    }
});

module.exports = router;