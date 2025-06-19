const corsOptions = {
  origin: [
    "http://10.0.60.24:8000", // local server
    "http://18.158.237.149:8001", // live server
    "http://18.158.237.149:8002", // live website
    "http://18.158.237.149:8003", // live dashboard
  ],
  credentials: true,
};

module.exports = corsOptions;
