'use strict';

const logger = require('../logger');

var db;
var queue;

class NotificationHandler {
  static setDB(plugin) {
    db = plugin;
  }

  static setQueue(plugin) {
    queue = plugin;
  }

  static publish(context, payload) {
    logger.info('NotificationHandler::publish context=' + context?.operationId);
  }
}

module.exports = NotificationHandler;
