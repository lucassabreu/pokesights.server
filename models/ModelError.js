'use strict';

var ModelError = function(message) {
    this.message = message;
    Error.captureStackTrace(this, ModelError);
};

ModelError.prototype = new Error();
ModelError.prototype.constructor = ModelError;

module.exports = ModelError;