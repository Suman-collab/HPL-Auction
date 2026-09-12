const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

router.get('/', healthController.getHealth);
router.get('/live', healthController.getLiveness);

module.exports = router;
