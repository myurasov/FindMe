var findme = function()
{
  var self = this;

  var channel;
  var mapInitialized = false;
  var clockDiff;
  var lastMessage;
  var clientUID;
  var curLocation;

  var construct = function()
  {
    channel = window.location.search.substr(1);

    // get cliend uid

    clientUID = Utils.getCookie('clientUID');

    if (clientUID == null)
    {
      clientUID = Math.random().toString().substring(2);
      Utils.setCookie('clientUID', clientUID, 365);
    }

    //

    if (channel != '')
    {
      // update freshness label
      setInterval(updateAgo, 1000);

      // get time diffrerence
      getTimeDiff(function(){
        // subscribe to location messages
        subscribe();

        // intiate geolocation
        startGeolocation();
      });

      // go to the current position
      document.getElementById('address').onclick = showMap;
    }
  }

  /**
   * Do geolocation
   */
  var startGeolocation = function()
  {
    if (navigator.geolocation)
    {
      var updateLocation = function(force)
      {
        console.log('updateLocation', arguments); // xxx

        // force location update
        force = force == undefined ? false : true;

        if (!force && lastMessage != null)
          var lastMessageAgo = Date.now() - clockDiff - lastMessage._timestamp;

        // if last message is received no longer than 15 minutes ago
        if (force || lastMessageAgo < 15 * 60 * 1000)
        {
          console.log('trying to get location'); // xxx

          navigator.geolocation.getCurrentPosition(function(e){

            console.log('got location', e); // xxx

            curLocation = {lat: e.coords.latitude, lon: e.coords.longitude};

            feedback({
              lat: e.coords.latitude,
              lon: e.coords.longitude,
              clientUID: clientUID,
              _timestamp: Date.now() - clockDiff
            });
          },
          function(error) {
            console.log('geolocation  error', error); // xxx
          }),
          {enableHighAccuracy: true}
        }
      }

      setInterval(updateLocation, 10000);
      updateLocation(true);
    }
  }

  /**
   * Calibrate clock
   */
  var getTimeDiff = function(callback)
  {
    PUBNUB.time(function(time) {
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
   * Message arrived
   */
  var onMessage = function(message)
  {
    lastMessage = message;
    updateAgo();
    showMap();
  }

  /**
   * Subscribe to
   */
  var subscribe = function()
  {
    // history
    PUBNUB.history(
    {channel: channel, limit: 1},
      function(messages) {
        if (lastMessage == null && messages.length > 0)
          onMessage(messages[0]);
      }
    );

    // live messages
    PUBNUB.subscribe({
      channel: channel,
      restore: false,
      callback: onMessage
    });
  }

  /**
   * Send feedback message
   */
  var feedback = function(message)
  {
    console.log('sending feedback to "' + channel + '_feedback"', message); // xxx

    PUBNUB.publish({
        channel: channel + '_feedback',
        message: message
    });
  };

  /**
   * Update freshness message
   */
  var updateAgo = function()
  {
    if (lastMessage != null)
    {
      // calculate time passed
      var lastMessageAgo = Date.now() - clockDiff - lastMessage._timestamp;

      document.getElementById('ago').innerHTML
        = 'updated ' + Utils.timeAgo(lastMessageAgo);

      // get distance

      var distance = "";

      if (curLocation != null && lastMessage != null)
      {
        // get units

        var lang = 'en_US';
        var units = 'mi';

        if (navigator.language) lang = navigator.language;
        if (navigator.browserLanguage) lang = navigator.browserLanguage;
        if (navigator.systemLanguage) lang = navigator.systemLanguage;
        if (navigator.userLanguage) lang = navigator.userLanguage;

        if (lang.indexOf('en') != -1) units = 'mi';
        else units = 'km';

        // distance message

        distance = Utils.geoDistance(curLocation, lastMessage.location, units);
        distance = Math.round(distance * 10) /10;
        distance = '<span id="dist">' + distance + ' ' + units + '</span>';
      }

      document.getElementById('address').innerHTML
        = distance + lastMessage.location.address;
    }
  }

  /**
   * Shows google map
   */
  var showMap = function()
  {
    var position = new google.maps.LatLng(
      lastMessage.location.lat,
      lastMessage.location.lon
    );

    if (!mapInitialized)
    {
      mapInitialized = true;

      var mapOptions = {
        zoom: 16,
        center: position,
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

      self.map = new google.maps.Map(
        document.getElementById("map"),
        mapOptions);

      self.marker = new google.maps.Marker({
        position: position,
        map: self.map
      });
    }
    else
    {
      self.map.setCenter(position);
      self.marker.setPosition(position);
    }
  }

  construct();
};