// src/routes/censusRoutes.js

const express = require('express');
const router = express.Router();
const CensusController = require('../controllers/CensusController');

const censusController = new CensusController();

// Census API Routes
router.get('/population', (req, res) => censusController.getPopulationByState(req, res));
router.get('/income', (req, res) => censusController.getMedianIncomeByState(req, res));
router.get('/housing', (req, res) => censusController.getHousingDataByState(req, res));
router.get('/education', (req, res) => censusController.getEducationByState(req, res));
router.get('/counties/:stateCode', (req, res) => censusController.getCountyDataByState(req, res));

module.exports = router;
