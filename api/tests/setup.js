// Runs before every test file: isolated configuration for the test process.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-not-used-anywhere-else-0123456789";
process.env.MONGO = "mongodb://placeholder/overridden-in-tests";
process.env.MONGO_AUTO_INDEX = "true";
process.env.RATE_LIMIT_ENABLED = "false";
process.env.CLOUD_NAME = "";
process.env.CLOUD_API_KEY = "";
process.env.CLOUD_API_SECRET = "";
