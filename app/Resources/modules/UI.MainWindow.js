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
  var settingsButton;
  var footerView;
  var refresh;

  var lastLat = null, lastLon = null;

  function _init()
  {
    settingsButton = Ti.UI.createButton({
      image:'images/settings-button.png'
    });

    view = Ti.UI.createWindow({
      title: ' ',
      rightNavButton: settingsButton,
      barImage: "images/bar-main.png",
      barColor: Project.Config.get('_barColor'),
      backgroundImage: "images/bg.png",
      backgroundRepeat: true
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
      height: mym.Utils.getScreenHeight("portrait") - 169,
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
      backgroundColor: "transparent",
      top: 0
    }));

    tableViewSection1.add(shareRow = Ti.UI.createTableViewRow({
      title: "Share",
      hasChild: true,
      backgroundColor: "white"
    }));

//    tableViewSection1.add(Ti.UI.createTableViewRow({
//      title: "Watchers",
//      hasChild: true
//    }));

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

    footerView = Ti.UI.createView({
      height: urlLabel.height,
      width: urlLabel.width
    });

    footerView.add(urlLabel);

    // refresh

    refresh = Ti.UI.createView({
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

    _initEvents();

    // Misc

    // update ago on annotations
    setInterval(updateAnnotation, 1000);
  }

  function _initEvents()
  {
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
      if (e.source == urlLabel) {
        Ti.Platform.openURL(Project.application.getLink());
      }
    });

    refresh.addEventListener("click", resetLink);

    shareRow.addEventListener("click", shareLocation);

    mapView.addEventListener("click", annotationClicked);
  }

  /**
   * Get distance from current position to coordinate
   */
  function getDistanceTo(lat, lon)
  {
    var distance = '';
    var curLocation = Project.application.lastLocationEvent;

    if (curLocation !== null)
    {
      var units = Titanium.Platform.locale.indexOf('en') == -1 ? 'km' : 'mi';

      distance = Project.Utils.geoDistance(
        {lat: curLocation.coords.latitude,
          lon: curLocation.coords.longitude},
        {lat: lat, lon: lon},
        units
      );

      distance = Math.round(distance * 10) / 10;
      distance = distance + ' ' + units;
    }

    return distance;
  }

  var activeAnnotation = null;
  //
  function updateAnnotation()
  {
    if (activeAnnotation !== null)
    {
      // milliseconds ago

      var ago = Date.now() -
        Project.application.messenger.getClockDiff() -
        activeAnnotation._timestamp;

      ago = Project.Utils.timeAgo(ago);

      // distance
      var distance = getDistanceTo(activeAnnotation.latitude, activeAnnotation.longitude);
      if (distance !== '') distance += ' away, ';

      // subtitle
      activeAnnotation.subtitle = distance + ago
    }
  };


  var annotationClickedStarted = false;
  var optionsDialog = null;
  //
  function annotationClicked(e)
  {
    if (e.source !== mapView)
      return;

    if (e.clicksource == 'pin')
    {
      activeAnnotation = e.annotation;

      if (activeAnnotation.subtitle == '')
        updateAnnotation();
    }
    else if (e.clicksource == null)
    {
      activeAnnotation = null;
    }
    else if (e.clicksource == 'rightButton')
    {
      if (annotationClickedStarted) return;

      annotationClickedStarted = true;

      var optionsDialogShown = false;
      var optionsDialogAlreadyClosed = false;
      var annotation = e.annotation;

      // options dialog

      optionsDialog = Titanium.UI.createOptionDialog({
        title: annotation.title,
        options: ["Open in Maps", "Delete", "Cancel"],
        destructive: 1,
        cancel: 2
      });

      optionsDialog.addEventListener("click", function(e) {
        optionsDialogAlreadyClosed = true;

        if (e.index == 0)
        {
          Ti.Platform.openURL('http://maps.apple.com/?q=' +
            annotation.latitude + ',' + annotation.longitude);
        }
        else if (e.index == 1)
        {
          // remove annotation from map
          mapView.removeAnnotation(annotation);

          // set active annotation to null
          activeAnnotation = null;

          // ignore client uid

          var ignoredUIDs = Project.Config.get('ignoredClientUIDs');

          if (ignoredUIDs.indexOf(annotation.clientUID) === -1)
            ignoredUIDs.push(annotation.clientUID);

          Project.Config.set('ignoredClientUIDs', ignoredUIDs).save();

          // set annotation to null
          annotations[annotation._index] = null;

          // remove saved watcher
          var w = Project.Config.get('watchers');
          w[annotation._index] = null;
          Project.Config.set('watchers', w).save();

          // update map regon
          updateMapRegion();
        }

        annotationClickedStarted = false;
      });

      if (Project.application.lastLocationEvent !== null)
      {
        // set progress spinner
        annotation.rightButton = Titanium.UI.iPhone.SystemButton.SPINNER;

        // try to show dialog with empty adress first

        _.delay(function(){
          if (!optionsDialogShown)
          {
            optionsDialog.show();
            annotation.rightButton = -13;
          }
        }, 1000);

        // resolve address
        Project.Utils.fetchAddress(annotation.latitude, annotation.longitude, function(address){
          if (!optionsDialogAlreadyClosed)
          {
            optionsDialogShown = true;
            annotation.rightButton = -13;
            optionsDialog.setTitle(annotation.title + "\n\n" + address);
            optionsDialog.hide();
            optionsDialog.show();
          }
        });
      }
      else
      {
        optionsDialog.show();
      }
    }
  }

  function shareLocation()
  {
    var optionsDialog = Titanium.UI.createOptionDialog({
      title: 'Share',
      options: ['Select Contact', 'Email', 'SMS', 'Cancel'],
      cancel: 3
    });

    optionsDialog.addEventListener("click", function(e){
      if (e.index == 0)
      {
        shareWithContact();
      }
      else if (e.index == 1)
      {
        Project.application.sendEmail();
      }
      else if (e.index == 2)
      {
        Project.application.sendSms();
      }
    });

    optionsDialog.show();
  }

  var contactsShown = false;
  //
  function shareWithContact()
  {
    if (contactsShown) return;

    contactsShown = true;
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
              contactsShown = false;
            }, 750)
          }
          else if (e.property == "phone")
          {
            _.delay(function(){
              _.delay(function(){hud.hideHud()}, 1000);
              Project.application.sendSms(e.value);
              propSelected = false;
              contactsShown = false;
            }, 750)
          }
        }
      },

      cancel: function(){
        hud.hideHud();
        propSelected = false;
        contactsShown = false;
      }
    });
  }

  /**
   * Reset link
   */
  function resetLink()
  {
    var alertBox = Titanium.UI.createAlertDialog({
      title: Ti.App.getName(),
      message: "Update the sharing link?",
      buttonNames: ['Update', 'Keep']
    });

    alertBox.show();

    alertBox.addEventListener("click", function(e){
      if (e.index == 0)
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

        // reset saved watchers
        Project.Config.set('watchers', []);

        // reset ignored annotations
        Project.Config.set('ignoredClientUIDs', []);

        // save config
        Project.Config.save();
      }
    });
  }

  /**
   * Feedback message arrived
   */
  function onFeedbackMessage(e)
  {
    if (Project.Config.get('ignoredClientUIDs').indexOf(e.message.clientUID) !== -1)
      return;

    var a = -1;
    var annotationExists = false;

    for (a in annotations)
    {
      if (annotations[a] !== null && annotations[a].clientUID == e.message.clientUID)
      {
        annotationExists = true;
        break;
      }
    }

    if (!annotationExists)
    {
      // create annotation
      a++;

      var colors = [
        Titanium.Map.ANNOTATION_GREEN,
        Titanium.Map.ANNOTATION_PURPLE,
        Titanium.Map.ANNOTATION_RED,
      ];

      var num = Project.Utils.count(annotations);

      annotations[a] = Titanium.Map.createAnnotation({
        latitude: e.message.lat,
        longitude: e.message.lon,
        title: "Watcher #" + (a + 1),
        subtitle: '',
        pincolor: colors[a % 3],
        animate: true,
        clientUID: e.message.clientUID,
        _timestamp: e.message._timestamp,
        rightButton: -13,//Titanium.UI.iPhone.systemButton.INFO_LIGHT,
        _index: a
      });

      // save watchers

      var w = Project.Config.get('watchers');

      w[a] = {
        latitude: annotations[a].latitude,
        longitude: annotations[a].longitude,
        title: annotations[a].title,
        pincolor: annotations[a].pincolor,
        clientUID: annotations[a].clientUID,
        _timestamp: annotations[a]._timestamp
      };

      Project.Config.set('watchers', w).save();

      //

      mapView.setAnnotations(filteredAnnotations());
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

  function filteredAnnotations()
  {
    var filtered = [];

    for (var a in annotations)
    {
      if (annotations[a] !== null)
        filtered.push(annotations[a]);
    }

    return filtered;
  }


  /**
   * Update map region
   */
  function updateMapRegion()
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

      for (var a in annotations)
      {
        if (annotations[a] !== null)
        {
          points.push(
            [annotations[a].longitude,
            annotations[a].latitude]
          );
        }
      }

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

  //

  _init();

  /**
   * Restore watchers' pins
   */
  view.restoreWatchers = function()
  {
    var watchers = Project.Config.get('watchers');

    for (var w in watchers)
    {
      if (watchers[w] !== null)
      {
        annotations[w] = Titanium.Map.createAnnotation({
          latitude: watchers[w].latitude,
          longitude: watchers[w].longitude,
          title: watchers[w].title,
          subtitle: '',
          pincolor: watchers[w].pincolor,
          animate: true,
          clientUID: watchers[w].clientUID,
          _timestamp: watchers[w]._timestamp,
          rightButton: -13,//Titanium.UI.iPhone.systemButton.INFO_LIGHT,
          _index: w
        });

      }
      else
      {
        annotations[w] = null;
      }
    }

    mapView.setAnnotations(filteredAnnotations());
  }

  return view;
}

