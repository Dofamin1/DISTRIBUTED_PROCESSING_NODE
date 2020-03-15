const uuidv4 = require("uuid/v4");

module.exports = {
  errorHandler(err) {
    console.log(err);
    throw new Error(err.message || "unknown error");
  },
  log(message) {
    const { LOGGER } = process.env;
    if (LOGGER) console.log(message);
  },
  now() {
    return Date.now();
  },
  generateUUID(role) {
    const { ENVIRONMENT } = process.env;
    if (ENVIRONMENT === "local") {
      console.log(
        `PLEASE ADD UUID - ${uuidv4()} TO YOUR ${role} NODE AS ENV VARIABLE `
      );
    }
    return uuidv4();
  },
};
