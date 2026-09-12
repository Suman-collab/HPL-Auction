const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');

router.get('/state', auctionController.getState);
router.post('/start-set', auctionController.startSet);
router.post('/set-current-player', auctionController.setCurrentPlayer);
router.post('/bid', auctionController.placeBid);
router.post('/sold', auctionController.markSold);
router.post('/unsold', auctionController.markUnsold);
router.post('/next', auctionController.nextPlayer);
router.post('/previous', auctionController.previousPlayer);
router.post('/skip', auctionController.skipPlayer);
router.post('/preview-override', auctionController.previewOverride);
router.post('/override', auctionController.overridePlayer);
router.post('/reopen', auctionController.reopenPlayer);
router.post('/undo', auctionController.undoLastAction);

module.exports = router;
