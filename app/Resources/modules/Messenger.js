/**
 * Events:
 *  ready
 *  feedbackMessage
 *  error
 */

Project.Messenger = function(channel)
{
  var self = this;

  // add events
  mym.EventsMixin(self);

  var pubnub;
  var clockDiff;
  var lastMessage;

  self._construct = function()
  {
    pubnub = require('lib/pubnub').init({
      ssl           : false,
      origin        : 'pubsub.pubnub.com',
      publish_key   : 'pub-a29834f0-2cd0-40a3-b0e4-5564a7c38df4',
      subscribe_key : 'sub-e4cc5bb3-9372-11e1-b75e-09816d97dcf7'
    });

    self._getTimeDiff(function(){
      self._subscribeToFeedback();
      self.fireEvent('ready');
    });
  }

  self._getTimeDiff = function(callback)
  {
    pubnub.time(function(time) {
        // time is returned in 1/10 parts of microsecond,
        // so we converting it to milliseconds by dividing by 1^4
        var timeEtalon = Math.round(time / 10000);

        // calculate difference between local and "true" time
        clockDiff = Date.now() - timeEtalon;

        if (callback != undefined)
          callback();
    });
  }

  /**
   * Fetch history
   */
  self.fetchFeedbackHistory = function(force)
  {
    pubnub.history(
      {channel: channel + '_feedback', limit: 1},
      function(messages) {
        if (messages.length > 0)
        {
          if (lastMessage == null || messages[0]._timestamp > lastMessage._timestamp)
          {
            self.fireEvent("feedbackMessage", {
              message: messages[0]
            });
          }
        }
      }
    );
  }

  /**
   * subscribe to feedback channel
   */
  self._subscribeToFeedback = function()
  {
    // history
    self.fetchFeedbackHistory();

    pubnub.subscribe({
      channel: channel + '_feedback',
      callback: function(message) {
        lastMessage = message;
        self.fireEvent("feedbackMessage", {
          message: message
        });
      },
      error: function(e) {
        self.fireEvent("error", {
          message: 'Failed to subscribe to feedback'
        });
      }
    });
  }

  self.publish = function(message)
  {
    // set timestamp
    message._timestamp = Date.now() - clockDiff;

    // set version
    message._version = Ti.App.getVersion();

    pubnub.publish({
      channel: channel,
      message: message,
      callback: function(e) {
        if (e[0] == 0)
          self.fireEvent('error', {message: e[1]});
      }
    });
  }

  self.getChannel = function()
  {
    return channel;
  }

  self.getClockDiff = function()
  {
    return clockDiff;
  }

  self.setChannel = function(newChannel)
  {
    pubnub.unsubscribe({channel: channel + '_feedback'});
    channel = newChannel;
    self._subscribeToFeedback();
  }

  self._construct();
}