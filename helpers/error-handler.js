function errHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ message: "The user is not authorized" });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  return res
    .status(500)
    .json({ message: err.message || "Internal Server Error" });
}

module.exports = errHandler;
