if (typeof mym == "undefined") var mym = {};

mym.Utils = {
  trim: function(str)
  {
    if (typeof str == "string")
    {
      return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }
    else
    {
      return str;
    }
  },

  readResource: function(resName)
  {
    return Ti.Filesystem.getFile(
      Ti.Filesystem.resourcesDirectory,
      resName).read().text;
  },

  round: function(number, precision)
  {
    if (typeof precision == "undefined") precision = 0;
    var e = Math.pow(10, precision);
    return Math.round(number * e) / e;
  },

  /**
   * Returns function that is called only once per delay milliseconds
   */
  dejitter: function(func, interval)
  {
    var r = function()
    {
      var now = (new Date()).getTime();
      var timePassed = now - r._lastCallTime;

      if (timePassed > r.interval)
      {
          r.source.apply(r.source, arguments); // call
          r._lastCallTime = now;
      }
      else
      {
        // too early
        r._deferred.args = arguments;

        if (r._execDeferred)
        {
          r._execDeferred = false;
          r._timeoutId = setTimeout(function() {
            r._deferred();
          }, r.interval - timePassed);
        }
      }
    }

    r.source = func;
    r.interval = interval;

    r.reset = function() {
      if (r._timeoutId)
        clearTimeout(r._timeoutId);
      r._lastCallTime = 0;
      r._timeoutId = null;
      r._execDeferred = true;
    };

    r._deferred = function() {
      r.source.apply(r.source, r._deferred.args);
      r._lastCallTime = (new Date()).getTime();
      r._execDeferred = true;
    };

    r.reset();

    return r;
  },

  alert: function(message, title, doneCallback)
  {
    if (title == undefined) title = Ti.App.name;

    var d = Titanium.UI.createAlertDialog({
      title: title,
      message: message
    });

    if (typeof doneCallback != "undefined")
      d.addEventListener("click", doneCallback);

    d.show();
  },

  formatCurreny: function(number)
  {
    return mym.Utils.round(number, 2).toFixed(2);
  }
}