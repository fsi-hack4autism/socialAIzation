// Azure App Service startup script
process.env.PORT = process.env.PORT || 80;
require('./dist/index.js');
