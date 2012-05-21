Project.Utils = {
  boundingRect: function(points)
  {
    if (points.length > 0)
    {
      var maxX = points[0][0], minX = points[0][0];
      var maxY = points[0][1], minY = points[0][1];

      for (var p = 1; p < points.length; p++)
      {
        var point = points[p];


        if (point[0] > maxX) maxX = point[0];
        if (point[0] < minX) minX = point[0];
        if (point[1] > maxY) maxY = point[1];
        if (point[1] < minY) minY = point[1];
      }

      return {
        top: maxY,
        bottom: minY,
        left: minX,
        right: maxX,
        center: [minX + (maxX - minX) / 2, minY + (maxY - minY) /  2],
        height: maxY - minY,
        width: maxX - minX
      }
    }

    return null;
  },

  createUID: function(length)
  {
    var uid = "";
    var pattern = "0123456789abcdefghijklmnopqrstuvwxyz";

    for (var i = 0; i < length; i++)
    {
      var c = pattern.charAt(Math.random() * pattern.length);
      uid += c;
    }

    return uid;
  },

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

    var _substitute = function(stringOrFunction, number) {
      var string = typeof stringOrFunction == "function"
      ? stringOrFunction(number, distanceMillis) : stringOrFunction;
      var value = ($l.numbers && $l.numbers[number]) || number;
      return string.replace(/%d/i, value);
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

    return mym.Utils.trim([prefix, words, suffix].join(" "));
  },

 _isAddressXhrRunning: false,

 /**
  * Fetch address from coords
  */
  fetchAddress: function(lat, lon, doneCallback)
  {
    if (!Project.Utils._isAddressXhrRunning)
    {
      Project.Utils._isAddressXhrRunning = true;

      var url = "http://maps.google.com/maps/geo?q={lat}%2C{lon}&output=json&oe=utf8"+
      "&key=ABQIAAAAPbc5fpwBCOuhSf4eK_srOhTae0RBrawVYDs3Fc0CWE-xTYhALhSGfRvFU9oMxGDRbITRcgIk60j8CA&{rnd}";

      url = url.replace("{rnd}", Math.random());
      url = url.replace("{lat}", lat);
      url = url.replace("{lon}", lon);

      var xhr = Ti.Network.createHTTPClient();
      xhr.timeout = 30 * 1000;
      xhr.open("GET", url);

      xhr.onload = function()
      {
        Project.Utils._isAddressXhrRunning = false;

        var data = JSON.parse(xhr.responseText);

        if (typeof data.Placemark != "undefined")
        {
          var address = data.Placemark[0].address;

          if (doneCallback != undefined)
            doneCallback(address);
        }
        else
        {
          // err
        }
      }

      xhr.onerror = function(event)
      {
        Project.Utils._isAddressXhrRunning = false;
      }

      xhr.send();
    }
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
  },

  count: function(objOrArray)
  {
    var c = 0;

    for (var i in objOrArray)
      c++;

    return c;
  }
}