let app;
let initError = null;

try {
  app = require('../server');
} catch (err) {
  initError = {
    message: err.message,
    stack: err.stack,
    name: err.name
  };
  console.error('Failed to initialize server:', err);
}

module.exports = (req, res) => {
  if (initError) {
    return res.status(500).json({
      error: 'API Initialization Failed',
      details: initError
    });
  }

  try {
    return app(req, res);
  } catch (err) {
    console.error('Unhandled runtime error in API handler:', err);
    return res.status(500).json({
      error: 'API Runtime Error',
      message: err.message,
      stack: err.stack
    });
  }
};
