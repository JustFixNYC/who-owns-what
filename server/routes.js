const router = require('express').Router();

const contacts = require('./controllers/contacts');
const landlord = require('./controllers/landlord');

router.get('/api/contacts', contacts.query);
router.get('/api/landlord', landlord.query);

module.exports = router;
