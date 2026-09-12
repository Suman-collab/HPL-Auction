const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const upload = require('../middleware/upload');
const multer = require('multer');
const path = require('path');

// Specialized upload for CSV files
const csvUpload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get('/', playerController.getPlayers);
router.get('/:id', playerController.getPlayerById);
router.post('/', upload.single('photo'), playerController.createPlayer);
router.put('/:id', upload.single('photo'), playerController.updatePlayer);
router.delete('/:id', playerController.deletePlayer);
router.post('/import-csv', csvUpload.single('file'), playerController.bulkImportCSV);

module.exports = router;
