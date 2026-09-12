const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const upload = require('../middleware/upload');

router.get('/', teamController.getTeams);
router.get('/:id', teamController.getTeamById);
router.post('/', upload.single('logo'), teamController.createTeam);
router.put('/:id', upload.single('logo'), teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

module.exports = router;
