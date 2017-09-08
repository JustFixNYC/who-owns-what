const router = require('express').Router();

const address = require('./controllers/address');

router.get('/address', address.query);
router.get('/address/export', address.export);

module.exports = router;
