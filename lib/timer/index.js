var bind = require('bind');
var template = require('./template');
var domify = require('domify');
var text = require('text');
var beep = require('./beep');
var Notifications = window.webkitNotifications
  || window.mozNotifications
  || window.Notifications;
var TimeView = require('time-view');
var span = require('span');
var raf = require('raf');

module.exports = Timer;

/**
 * Timer view.
 *
 * @param {String} dur
 * @return {Timer}
 * @todo Refactor out 'enable notifications' button
 */
 
function Timer(dur) {
  var self = this;
  this.span = span(dur);
  this.el = domify(template);
  this.enableNotifications(); 
  this.time = new TimeView(this.span);
  this.el.appendChild(this.time.el);
  this.stopped = false;
  this.start = Date.now();
  
  setTimeout(function() {
    self.start = Date.now();
    (function animate() {
      if (self.stopped) return;
      var left = self.start + self.span - Date.now();
      if (left > 0) {
        self.update(left);
        raf(animate);
      } else {
        self.end();
      }
    })();
  });
};

/**
 * Abort.
 *
 * @api public
 */

Timer.prototype.abort = function() {
  this.stopped = true;
  this.time.destroy();
};

/**
 * Update display.
 *
 * @param {Number} left
 * @api private
 */

Timer.prototype.update = function(left) {
  this.time.update(left);
};

/**
 * When the timer is done.
 *
 * @api private
 */

Timer.prototype.end = function() {
  notify('Alert', 'Timer finished');
  beep();
  this.time.end();
};

/**
 * Show or hide 'enable notifications' button.
 *
 * @api private
 */

Timer.prototype.enableNotifications = function() {
  if (!Notifications) return;
  var enable = this.el.querySelector('button');

  if (!Notifications.checkPermission()) {
    enable.parentNode.removeChild(enable);
  } else {
    enable.addEventListener('click', function() {
      enableNotifications(function(err) {
        if (!err) enable.parentNode.removeChild(enable);
      });
    });
  }
};

/**
 * Notification api helper.
 *
 * @param {String} title
 * @param {String} text
 * @api private
 */

function notify(title, text) {
  if (!Notifications) return;
  var hasCheck = !! Notifications.checkPermission;
  if (hasCheck && Notifications.checkPermission()) return;
  
  Notifications.createNotification('/favicon.ico', title, text).show();
}

/**
 * Enable browser notifications.
 *
 * @api private
 */

function enableNotifications(fn) {
  Notifications.requestPermission(function(perm) {
    if (perm == 'granted') fn();
    else fn(new Error('denied'));
  });
}