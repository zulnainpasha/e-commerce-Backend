const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, required: true },
  role: {
    type: String,
    enum: ["user", "admin", "manager"],
    default: "user",
  },
  street: { type: String, default: "" },
  apartment: { type: String, default: "" },
  city: { type: String, default: "Bangalore" },
  country: { type: String, default: "India" },
  zip: { type: String, default: "" },
});

UserSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

UserSchema.set("toJSON", { virtuals: true });

exports.User = mongoose.model("User", UserSchema);
exports.UserSchema = UserSchema;
