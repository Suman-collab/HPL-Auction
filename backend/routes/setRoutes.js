const express = require('express');
const router = express.Router();
const setController = require('../controllers/setController');

router.get('/', setController.getSets);
router.get('/:id', setController.getSetById);
router.post('/', setController.createSet);
router.post('/create-unsold-set', setController.createUnsoldSet);
router.put('/:id', setController.updateSet);
router.delete('/:id', setController.deleteSet);
router.post('/:id/players', setController.addPlayersToSet);
router.delete('/:id/players/:playerId', setController.removePlayerFromSet);
router.post('/:id/reorder', setController.reorderPlayers);

module.exports = router;
