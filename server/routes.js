const router = require('express').Router();

const contacts = require('./controllers/contacts');
const landlords = require('./controllers/landlords');
const address = require('./controllers/address');

router.get('/contacts', contacts.query);
router.get('/landlords', landlords.query);
router.get('/address', address.query);
router.get('/address/export', address.export);

module.exports = router;
