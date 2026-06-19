'use strict';

const config = require('./config');
const logger = require('./logger');
const ExpressServer = require('./expressServer');
const Service = require('./services/Service');
const NotificationHandler = require('./services/NotificationHandler');
const plugins = require('./plugins/plugins');

Service.setDB(plugins.db);
Service.setNotifier(NotificationHandler);

const launchServer = async () => {
  try {
    const expressServer = new ExpressServer(config.URL_PORT, config.OPENAPI_YAML);
    await expressServer.launch();
    logger.info('Express server running on port ' + config.URL_PORT);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

launchServer().catch(e => logger.error(e));
