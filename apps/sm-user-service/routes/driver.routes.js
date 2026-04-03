// apps/sm-user-service/routes/driver.routes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const driverController = require('../controllers/driver.controller');

router.post('/', driverController.createDriver);
router.get('/', driverController.getAllDrivers);
router.put('/:id', driverController.updateDriver);
router.delete('/:id', driverController.deleteDriver);

module.exports = router;
