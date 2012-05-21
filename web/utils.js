var Utils = {
  timeAgo: function(distanceMillis)
  {
    var _settings = {
      allowFuture: false,
      strings: {
        prefixAgo: "",
        prefixFromNow: "",
        suffixAgo: "",
        suffixFromNow: "",
        second: "a second ago",
        seconds: "%d seconds ago",
        minute: "about a minute ago",
        minutes: "%d minutes ago",
        hour: "about an hour ago",
        hours: "about %d hours ago",
        day: "a day ago",
        days: "%d days ago",
        month: "about a month ago",
        months: "%d months ago",
        year: "about a year ago",
        years: "%d years ago",
        numbers: []
      }
    };

    var $l = _settings.strings;
    var prefix = $l.prefixAgo;
    var suffix = $l.suffixAgo;

    if (_settings.allowFuture) {
      if (distanceMillis < 0) {
        prefix = $l.prefixFromNow;
        suffix = $l.suffixFromNow;
      }
      distanceMillis = Math.abs(distanceMillis);
    }

    var seconds = distanceMillis / 1000;
    var minutes = seconds / 60;
    var hours = minutes / 60;
    var days = hours / 24;
    var years = days / 365;

    var _substitute = function(string, number) {
      return string.replace(/%d/i, number);
    }

    var words =
    seconds < 1.5 && _substitute($l.second) ||
    seconds < 60 && _substitute($l.seconds, Math.round(seconds)) ||
    seconds < 90 && _substitute($l.minute, 1) ||
    minutes < 45 && _substitute($l.minutes, Math.round(minutes)) ||
    minutes < 90 && _substitute($l.hour, 1) ||
    hours < 24 && _substitute($l.hours, Math.round(hours)) ||
    hours < 48 && _substitute($l.day, 1) ||
    days < 30 && _substitute($l.days, Math.floor(days)) ||
    days < 60 && _substitute($l.month, 1) ||
    days < 365 && _substitute($l.months, Math.floor(days / 30)) ||
    years < 2 && _substitute($l.year, 1) ||
    _substitute($l.years, Math.floor(years));

    return Utils.trim([prefix, words, suffix].join(" "));
  },

  trim: function(str)
  {
    if (typeof str == "string")
    {
      str = str.replace(/^\s+/, '');

      for (var i = str.length - 1; i >= 0; i--)
      {
        if (/\S/.test(str.charAt(i)))
        {
          str = str.substring(0, i + 1);
          break;
        }
      }
    }

    return str;
  },

  /**
   * Returns function that is called only once per delay milliseconds
   *
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

  setCookie: function(cookieName, value, expiresDays)
  {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + expiresDays);

    var cookieValue =
      escape(value) + ((expiresDays == null)
        ? ""
        : "; expires=" + exdate.toUTCString());

    document.cookie = cookieName + "=" + cookieValue;
  },

  getCookie: function(cooikeName)
  {
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++)
    {
      var x = cookies[i].substr(0, cookies[i].indexOf("="));
      var y = cookies[i].substr(cookies[i].indexOf("=") + 1);
      x = x.replace(/^\s+|\s+$/g, "");

      if (x == cooikeName)
        return unescape(y);
    }

    return null;
  },

  /**
   * Calculates distance between two coordinates in kilometers
   *
   * @param p1 {lat: degrees, lon: degrees}
   * @param p2 {lat: degrees, lon: degrees}
   */
  geoDistance: function(p1, p2, units)
  {
    var r = 6372.8;
    var gr = 180 / Math.PI;

    // http://en.wikipedia.org/wiki/Great-circle_distance
    // Vicenty's formula

    // alt
    // var ds = Math.acos(Math.sin(p1.lat) * Math.sin(p2.lat) +
    //    Math.cos(p1.lat) * Math.cos(p2.lat) * Math.cos(p2.lon - p1.lon));

    var dLon = (p2.lon - p1.lon) / gr;
    var a = Math.pow(Math.cos(p2.lat / gr) * Math.sin(dLon), 2);
    var b = Math.pow(Math.cos(p1.lat / gr) * Math.sin(p2.lat / gr) - Math.sin(p1.lat / gr) *
      Math.cos(p2.lat / gr) * Math.cos(dLon), 2);
    var c = Math.sin(p1.lat / gr) * Math.sin(p2.lat / gr) + Math.cos(p1.lat / gr) *
      Math.cos(p2.lat / gr) * Math.cos(dLon);
    var ds = Math.atan2(Math.sqrt(a +b), c);
    var d = r * ds;

    if (units == 'mi') d /= 1.609344; // mile
    else if (units == 'nmi') d /= 1.85200; // nautical mile
    else if (units == 'm') d *= 1000;

    return d;
  }
}