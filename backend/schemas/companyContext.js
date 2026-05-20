const mongoose = require("mongoose");

const companyContextSchema = new mongoose.Schema(
  {
    name:                   { type: String, default: "" },
    industry:               { type: String, default: "" },
    description:            { type: String, default: "" },
    services:               { type: String, default: "" },
    supportPolicies:        { type: String, default: "" },
    commonIssues:           { type: String, default: "" },
    escalationProcess:      { type: String, default: "" },
    additionalInstructions: { type: String, default: "" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompanyContext", companyContextSchema);
