const corsOptions = {
  origin: [
    "http://10.0.60.24:8000", // local server
    "http://10.0.60.24:8001", // local server
    "http://10.0.60.24:8002", // local server
    "http://10.0.60.24:8003", // local server
    "http://10.10.20.54:8001", // local website
    "http://10.10.20.54:8002", // local
    "http://10.10.20.54:8003", // local
    "http://10.10.20.54:8004", // local
    "http://10.10.20.54:8005", // local

    "http://18.158.237.149:8001", // live server
    "http://18.158.237.149:8002", // live website
    "http://18.158.237.149:8003", // live dashboard
    "http://63.178.140.14:8001", // live server
    "http://63.178.140.14:8002", // live website
    "http://63.178.140.14:8003", // live dashboard

    "http://3.76.70.78:4173", // live dashboard
    "http://3.76.70.78:8002", // live website
    "https://betwisepicks.com", // live website
    "https://www.betwisepicks.com", // live website
    "http://betwisepicks.com", // live website
    "https://admin.betwisepicks.com", // live dashboard
    "http://admin.betwisepicks.com", // live dashboard
  ],
  credentials: true,
};

module.exports = corsOptions;
