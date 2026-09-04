const { cleanEnv, str, port } = require('envalid');

const validateEnv = () => {
  cleanEnv(process.env, {
    MONGO_URI: str({ desc: 'MongoDB connection string' }),
    JWT_SECRET: str({ desc: 'Secret key for signing JWTs' }),
    GEMINI_API_KEY: str({ desc: 'Google Gemini API Key' }),
    PORT: port({ default: 5000 }),
  });
};

module.exports = validateEnv;