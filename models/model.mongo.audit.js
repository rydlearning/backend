/**
 /Author: Revelation A.F
 /Git: nusktec
 **/
const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    agent: { type: String, required: true }, // Could be user ID or system process
    reasons: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
