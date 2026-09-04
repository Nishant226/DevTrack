const errorHandler = (err, req, res, next) => {
  // Agar status code already set nahi hai toh default 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    // Production mode mein stack trace hide ho jayega security ke liye
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;