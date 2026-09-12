const REQUIRED_ENVIRONMENT_VARIABLES = [
  'MONGO_URI',
  'CORS_ORIGIN',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'ADMIN_SECRET_KEY',
  'TEAM_PASSKEY',
];

function validateEnvironment() {
  const missing = REQUIRED_ENVIRONMENT_VARIABLES.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }
}

module.exports = { validateEnvironment };
