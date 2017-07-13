const db = require('../services/queries');

module.exports = {
  getContacts(req, res) {

    let housenumber = req.query.housenum,
        streetname = req.query.streetname,
        boro = req.query.boro;

    db.getBuildingContacts(housenumber, streetname, boro)
      .then(reg => res.status(201).send(reg))
      .catch(error => res.status(400).send(error));
  },
};
