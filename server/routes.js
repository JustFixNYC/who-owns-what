const router = require('express').Router();

const contacts = require('./controllers/contacts');
const landlord = require('./controllers/landlord');

router.get('/contacts', contacts.query);
router.get('/landlord', landlord.query);

module.exports = router;
