const router = require('express').Router();

const address = require('./controllers/address');
const landlord = require('./controllers/landlord');

router.get('/address', address.query);
router.get('/address/aggregate', address.aggregate);
router.get('/address/export', address.export);
router.get('/landlord', landlord.query);

module.exports = router;
