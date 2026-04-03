// apps/sm-transport-service/routes/vehicle.routes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const vehicleController = require('../controllers/vehicle.controller');

router.post('/', vehicleController.createVehicle);
router.get('/', vehicleController.getAllVehicles);
router.put('/:id', vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
