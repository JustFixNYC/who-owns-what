const express = require("express");
const router = express.Router();

const address = require("./controllers/address");
const landlord = require("./controllers/landlord");
const subscribe = require("./controllers/subscribe");

router.get("/address", address.query);
router.get("/address/aggregate", address.aggregate);
router.get("/address/dap-aggregate", address.dapAggregate);
router.get("/address/buildinginfo", address.buildinginfo);
router.get("/address/salehistory", address.salehistory);
router.get("/address/indicatorhistory", address.indicatorhistory);
router.get("/address/export", address.export);
router.get("/landlord", landlord.query);
router.post("/subscribe", subscribe.send);

module.exports = router;
