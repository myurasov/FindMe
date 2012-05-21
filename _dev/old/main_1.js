var findme = {

  map: null,
  marker: null,
  mapInitDone: false,
  lastData: null,
  updatingLocation: false,
  spire: null,
  spireTimeCal: 0,
  channel: '',
  clientUID: '',
  lastMessage: null,

  init: function() {
    // create spire

    var Spire = require('./spire.io.js');

    findme.spire = new Spire({
      secret: 'Ac-5u7V8SNMcy3UzKVvzfV87Q-gdIL'
    });

    //

    findme.channel = window.location.search.substr(1);

    if (findme.channel != '')
    {

      // update freshness label
      setInterval(function(){
        findme.updateAgo();
      }, 1000);

      // subscribe to location updates
      findme.spire.subscribe(findme.channel, {orderBy: 'asc', limit: 1},
        function (messages) {
          findme.lastMessage = messages[0];
          findme.update()
        }
      );

      // calibrate time diff
      findme.calibrateTimeDiff();

      // geolocation

      findme.clientUID = Math.random().toString().substring(2);

      if (navigator.geolocation)
      {
        var sendPos = function(position) {
          var lat = position.coords.latitude;
          var lon = position.coords.longitude;

          var message = {
            lat: lat,
            lon: lon,
            clientId: findme.clientUID
          };

          findme.spire.publish(
            findme.channel + '_feedback', message
          );
        };
//        navigator.geolocation.watchPosition(sendPos);
        navigator.geolocation.getCurrentPosition(sendPos);
      }
    }
  },

  calibrateTimeDiff: function()
  {
    var timeCalChannel = 'timecal_'
      + Math.random().toString().substring(2);

    // send time calibration message
    findme.spire.subscribe(timeCalChannel, {orderBy: 'asc', limit: 1},
      function (messages) {
        findme.spireTimeCal = 1000 * (
          /* diff */    (Date.now() - messages[0].timestamp / 1000) -
          /* latency */ (Date.now() - messages[0].data.content.time) / 2
        );

        findme.lastMessage = messages[0];
        findme.update();
      }
    );

    findme.spire.publish(timeCalChannel, {
      time: Date.now()
    });
  },

  //

  showMap: function(){
    var pos = new google.maps.LatLng(
      findme.lastData.lat, findme.lastData.lon);

    if (!findme.mapInitDone)
    {
      findme.mapInitDone = true;


      var mapOptions = {
        zoom: 16,
        center: pos,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        panControl: false,
        panControlOptions: {
          position: google.maps.ControlPosition.TOP_RIGHT
        },
        zoomControl: true,
        zoomControlOptions: {
          style: google.maps.ZoomControlStyle.LARGE,
          position: google.maps.ControlPosition.LEFT_CENTER
        },
        scaleControl: true,
        scaleControlOptions: {
          position: google.maps.ControlPosition.BOTTOM_LEFT
        },
        streetViewControl: false
      }

      findme.map = new google.maps.Map(document.getElementById("map"), mapOptions);

      findme.marker = new google.maps.Marker({
        position: pos,
        map: findme.map
      });
    }
    else
    {
      findme.map.setCenter(pos);
      findme.marker.setPosition(pos);
    }
  },

  //

  update: function() {

    if (findme.lastMessage != null)
    {
      var message = findme.lastMessage;

      findme.lastData = {
        ts: message.timestamp + findme.spireTimeCal,
        lat: message.data.content.lat,
        lon: message.data.content.lon,
        address: message.data.content.address
      }

      findme.updateAgo();
      findme.showMap();
    }
  },

  updateAgo: function(){
    if (findme.lastData != null)
    {
      document.getElementById('ago').innerHTML
        = "updated " + Utils.timeAgo((Date.now() - findme.lastData.ts / 1000));
      document.getElementById('address').innerHTML
        = findme.lastData.address;
    }
    else
    {
      document.getElementById('address').innerHTML
      = "&nbsp;";
    }
  }
};

var Utils = {
  timeAgo: function(distanceMillis)
  {
    var _settings = {
      refreshMillis: 10,
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
  }
}