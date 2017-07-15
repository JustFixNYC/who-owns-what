const router = require('express').Router();

const contacts = require('./controllers/contacts');
const bizAddresses = require('./controllers/bizAddresses');

router.get('/api/contacts', contacts.query);
router.get('/api/bizaddresses', bizAddresses.query);

module.exports = router;
