const mongoose = require('mongoose');

const MarketTrendSchema = new mongoose.Schema({
  title: String,
  description: String,
});

const MarketTrend = mongoose.model('MarketTrend', MarketTrendSchema);

module.exports = MarketTrend;
