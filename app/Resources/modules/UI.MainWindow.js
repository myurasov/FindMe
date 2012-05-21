/**
 * Events:
 *
 */

Project.UI.createMainWindow = function()
{
  var view;
  var tableView;
  var mapView;
  var addressLabel;
  var urlLabel;
  var shareRow;
  var annotations = [];
  var labelHost;
  var hud;

  var lastLat = null, lastLon = null;

  function _init()
  {
    var settingsButton = Ti.UI.createButton({
      image:'images/settings-button.png'
    });

    view = Ti.UI.createWindow({
      title: ' ',
      rightNavButton: settingsButton,
      barImage: "images/bar-main.png",
      barColor: Project.Config.get('_barColor'),
      backgroundColor: "white"
    });

    //

    view.add(hud = mym.UI.createHudMessage({
      zIndex: 5
    }));

    mapView = Titanium.Map.createView({
      mapType: Titanium.Map.STANDARD_TYPE,
      animate: true,
      regionFit: true,
      userLocation: true,
      height: 246 + 65,
      top: 10,
      left: 10,
      width: 300,
      borderRadius: 10,
      zIndex: 0
    });

    // map shadow

    mapView.add(Ti.UI.createView({
      top: 0,
      height: 16,
      backgroundImage: "images/map-bg-top.png",
      width: mapView.width,
      zIndex: 2
    }));

    mapView.add(Ti.UI.createView({
      bottom: 0,
      height: 16,
      backgroundImage: "images/map-bg-bottom.png",
      width: mapView.width,
      zIndex: 2
    }));

    mapView.add(Ti.UI.createView({
      left: 0,
      top: 16,
      width: 16,
      backgroundImage: "images/map-bg-left.png",
      height: mapView.height - 32,
      zIndex: 2
    }));

    mapView.add(Ti.UI.createView({
      right: 0,
      top: 16,
      width: 16,
      backgroundImage: "images/map-bg-right.png",
      height: mapView.height - 32,
      zIndex: 2
    }));

    //

    var tableViewSection1 = Ti.UI.createTableViewSection();

    view.add(tableView = Ti.UI.createTableView({
      style: Titanium.UI.iPhone.TableViewStyle.GROUPED,
       backgroundImage: "images/bg.png",
       backgroundRepeat: true,
       top: 0
    }));

    tableViewSection1.add(shareRow = Ti.UI.createTableViewRow({
      title: "Share",
      hasChild: true
    }));

    // header

    addressLabel = Ti.UI.createLabel({
      height: 45,
      color: "black",
      text: "Locating...",
      opacity: 0.7,
      font: {
        fontSize: 14,
        fontFamily: "Helvetica-Bold"
      },
      left: 8,
      right: 8,
      textAlign: 'center'
    });

    labelHost = Ti.UI.createView({
      backgroundColor: "white",
      opacity: 0.9,
      top: 0,
      height: 55,
      zIndex: 1
    })

    var hdr = Ti.UI.createView({
      height: mapView.height + mapView.top
    });

    labelHost.add(addressLabel);
    mapView.add(labelHost);

    hdr.add(mapView);

    tableView.setHeaderView(hdr)

    // footer

    urlLabel = Ti.UI.createLabel({
      text: Project.application.getLink(true),
      height: 20,
      font: {
        fontSize: 15,
        fontFamily: "Helvetica"
      },
      color: "#777",
      textAlign: "center",
      shadowColor: "#fff",
      shadowOffset: {
        x: 1,
        y: 1
      },
      zIndex: 1,
      width: 180,
      left: (tableView.width - 180) / 2
    });

    var footerView = Ti.UI.createView({
      height: urlLabel.height,
      width: urlLabel.width
    });

    footerView.add(urlLabel);

    // refresh

    var refresh = Ti.UI.createView({
      backgroundImage: 'images/refresh.png',
      height: 20,
      width: 39,
      right: 0,
      zIndex: 2
    });

    footerView.add(refresh);

    //

    tableView.setFooterView(footerView);

    //

    tableView.setData([tableViewSection1]);

    // Events

    Ti.App.addEventListener("proximity", function(e){
      if (e.state) updateMapRegion();
    });

    view.addEventListener("focus", function(e){
      _.delay(Project.application.askForRating, 3000);
    });

    settingsButton.addEventListener("click", function(e){
      Project.application.showSettings();
    });

    Ti.App.addEventListener('app:locationPublished', function(e){
      addressLabel.setText("I am @ " + e.location.address);
    });

    Ti.Geolocation.addEventListener("location", function(e){
      if (e.success)
      {
        lastLat = e.coords.latitude;
        lastLon = e.coords.longitude;
        _updateMapRegion();
      }
    });

    labelHost.addEventListener("click", updateMapRegion);

    Project.application.messenger.addEventListener("feedbackMessage", onFeedbackMessage);

    footerView.addEventListener("click", function(e){
      if (e.source == urlLabel)
        Ti.Platform.openURL(Project.application.getLink());
    });

    refresh.addEventListener("click", resetLink);

    shareRow.addEventListener("click", function(e){
      var propSelected = false;

      hud.showHud();

      Ti.Contacts.showContacts({
        animated: true,

        fields: ["email", "phone"],

        selectedProperty: function(e) {
          if (!propSelected)
          {
            propSelected = true;

            if (e.property == "email")
            {
              _.delay(function(){
                _.delay(function(){hud.hideHud()}, 1000);
                Project.application.sendEmail(e.person.firstName, e.value);
                propSelected = false;
              }, 750)
            }
            else if (e.property == "phone")
            {
              _.delay(function(){
                _.delay(function(){hud.hideHud()}, 1000);
                Project.application.sendSms(e.value);
                propSelected = false;
              }, 750)
            }
          }
        },

        cancel: function(){
          hud.hideHud();
          propSelected = false;
        }
      });
    });

    // Misc

    // update ago on annotations
    setInterval(function(){
      for (var a = 0; a < annotations.length; a++)
      {
        // milliseconds ago
        var ago = Date.now() -
        Project.application.messenger.getClockDiff() -
        annotations[a]._timestamp;

        annotations[a].subtitle = Project.Utils.timeAgo(ago);
      }
    }, 1000);
  }

  /**
   * Reset link
   */
  var resetLink = function()
  {
    // new channel
    Project.Config.set('channel', Project.Utils.createUID(7)).save();

    // set new channel
    Project.application.messenger.setChannel(Project.Config.get('channel'));

    // update link
    urlLabel.setText(Project.application.getLink(true));

    // reset location publish interval
    Project.application.publishLocation.reset();

    // update location
    Project.application.updateLocation();
    Project.application.publishLastLocation();

    // reset annotations
    annotations = [];
    mapView.setAnnotations(annotations);
  }

  /**
   * Feedback message arrived
   */
  var onFeedbackMessage = function(e)
  {
    for (var a = 0; a < annotations.length; a++)
    {
      if (annotations[a].clientUID == e.message.clientUID)
        break;
    }

    if (undefined == annotations[a])
    {
      // create annotation

      var colors = [
        Titanium.Map.ANNOTATION_GREEN,
        Titanium.Map.ANNOTATION_PURPLE,
        Titanium.Map.ANNOTATION_RED,
      ];

      annotations[a] = Titanium.Map.createAnnotation({
        latitude: e.message.lat,
        longitude: e.message.lon,
        title: "Watcher #" + (a + 1),
        subtitle: '',
        pincolor: colors[a % 3],
        animate: true,
        clientUID: e.message.clientUID,
        _timestamp: e.message._timestamp
      });

      mapView.setAnnotations(annotations);
    }
    else
    {
      // move annotation
      annotations[a].latitude = e.message.lat;
      annotations[a].longitude = e.message.lon;
      annotations[a]._timestamp = e.message._timestamp;
    }

    updateMapRegion();
  }


  /**
   * Update map region
   */
  var updateMapRegion = function()
  {
    if (lastLon === null || lastLat === null) return;
    if (Titanium.App.proximityState) return;

    // x: longitude
    // y: latitude

    var centerLat = lastLat;
    var centerLon = lastLon;
    var deltaLat = 0.0045;
    var deltaLon = 0.0045;
    var topLabelDelta = labelHost.height / mapView.height * 0.0045;

    if (annotations.length > 0)
    {
      // find bounding rect

      var points = [[lastLon, lastLat]];

      for (var a = 0; a < annotations.length; a++)
        points.push([annotations[a].longitude, annotations[a].latitude]);

      var box = Project.Utils.boundingRect(points);

      centerLon = box.center[0];
      centerLat = box.center[1];
      deltaLon = Math.max(deltaLon, box.width);
      deltaLat = Math.max(deltaLat, box.height);

      topLabelDelta = labelHost.height / mapView.height * Math.max(deltaLat, deltaLon);
      centerLat += topLabelDelta;
    }

    var addDelta = topLabelDelta * 1.1;

    mapView.setRegion({
      latitude: centerLat,
      longitude: centerLon,
      latitudeDelta: deltaLat + addDelta,
      longitudeDelta: deltaLon + addDelta
    });
  };

  var _updateMapRegion = mym.Utils.dejitter(updateMapRegion, 3000);

  _init();

  return view;
}

