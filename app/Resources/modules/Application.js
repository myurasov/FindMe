Project.Application = function()
{
  var self = this;
  var navGroup;
  var navHostWindow;
  var settingsWindow;

  var lastLocationEvent = null;

  self.mainWindow = null;
  self.channel = null;
  self.bgService = null;

  /**
   * Initialize application
   */
  self.init = function()
  {
    // Misc

    // load config
    Project.Config.load().save();

    // prevent screen from locking
    Titanium.App.idleTimerDisabled = true;

    // proximity sensor
    Titanium.App.proximityDetection =
      Project.Config.get('proximitySensor');

    // create messenger
    self.messenger = new Project.Messenger(
      Project.Config.get('channel')
    );

    // Create UI

    self.mainWindow = Project.UI.createMainWindow();

    navHostWindow = Ti.UI.createWindow({
      navBarHidden: true
    });

    navGroup = Ti.UI.iPhone.createNavigationGroup({
      window: self.mainWindow
    })

    navHostWindow.add(navGroup);

    // Show UI

    navHostWindow.open({
      modal: true
    });

    // Events

    self.messenger.addEventListener("ready", function(e){
      // start geolocation
      self.startGeolocation();
    });

    Ti.App.addEventListener("resume", function(e){
      self.messenger.fetchFeedbackHistory();
      _.delay(Project.application.askForRating, 3000);
    });

    // Misc
    if (Project.Config.get('backgroundService'))
      self.registerBgService();
  }

  /**
   * Ask to give rating
   */
  self.askForRating = function() {
    var lastAskedForRatingDate = Project.Config.get('lastAskedForRatingDate');
    var noCount = Project.Config.get('askedForRatingNo');
    var yesCount = Project.Config.get('askedForRatingYes');
    var doneCount = Project.Config.get('askedForRatingDone');

    if (
      Date.now() - lastAskedForRatingDate > 3 * 24 * 60 * 60 * 1000 // 3 days
      && noCount < 5
      && yesCount < 3
      && doneCount == 0
    )
    {
      var alertBox = Titanium.UI.createAlertDialog({
        title: "Rate Me",
        message: "If you like this app, please give it 5 stars in the App Store!",
        buttonNames: ['Rate Now', 'Later', 'Done!']
      });

      alertBox.show();

      alertBox.addEventListener("click", function(e){
        if (e.index == 0)
        { // yes
          Ti.Platform.openURL(self.getiTunesUrl());
          Project.Config.set('askedForRatingYes', yesCount + 1).save();
        }
        else if (e.index == 1)
        { // no
          Project.Config.set('askedForRatingNo', noCount + 1).save();
        }
        else if (e.index == 2)
        { // done
          Project.Config.set('askedForRatingDone', doneCount + 1).save();
        }
      });

      Project.Config.set('lastAskedForRatingDate', Date.now()).save();
    }
  };

  /**
   * Register bg service
   */
  self.registerBgService = function()
  {
    if (self.bgService == null)
      self.bgService = Ti.App.iOS.registerBackgroundService({url:'modules/BgService.js'});
  }

  /**
   * Unregister bg service
   */
  self.unregisterBgService = function()
  {
    if (self.bgService != null)
    {
      self.bgService.unregister();
      self.bgService = null;
    }
  }

  /**
   * Save config
   */
  self.saveConfig = mym.Utils.dejitter(Project.Config.save, 250);

  self.showSettings = function()
  {
    if (settingsWindow == null)
      settingsWindow = Project.UI.createSettingsWindow();

    self.navigateTo(settingsWindow);
  }

  /**
   * Navigate to window
   */
  self.navigateTo = function(window)
  {
    navGroup.open(window);
  }

  /**
   * Start geolocation
   */
  var geolocationStarted = false;
  self.startGeolocation = function()
  {
    if (geolocationStarted) return;
      geolocationStarted = true;

    Ti.Geolocation.purpose = "Geolocation";
    Ti.Geolocation.preferredProvider = "gps";
    Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_NEAREST_TEN_METERS;
    Ti.Geolocation.distanceFilter = 3;

    Ti.Geolocation.addEventListener("location", self.onLocation);
    setInterval(self.updateLocation, 3000);
    self.updateLocation();
  }

  /**
   * Update location
   */
  self.updateLocation = function()
  {
    Ti.Geolocation.getCurrentPosition(self.onLocation);
  }

  /**
   * Publish last known location
   */
  self.publishLastLocation = function()
  {
    if (lastLocationEvent != null)
      self.publishLocation(lastLocationEvent.coords.latitude,
        lastLocationEvent.coords.longitude);
  }

  /**
   * We've got location
   */
  self.onLocation = function(e)
  {
    if (e.success)
    {
      lastLocationEvent = e;

      self.publishLocation(
        e.coords.latitude,
        e.coords.longitude
      );
    }
  }

 /**
  * Publich location
  */
  self.publishLocation = mym.Utils.dejitter(function(lat, lon) {
    Project.Utils.fetchAddress(lat, lon, function(address) {
      var message = {
        location: {
          lat: lat,
          lon: lon,
          address: address
        }
      };

      self.messenger.publish(message);
      Ti.App.fireEvent('app:locationPublished', message);
    });
  }, Project.Config.get('publishTimeout') * 1000);

  /**
 * Get link to web app
 */
  self.getLink = function(shortLink)
  {
    if (shortLink == undefined)
      shortLink = false;

    return (!shortLink ? 'http://' : '') + "findme.ws?" + self.messenger.getChannel();
  }

  /**
   * Get iTunes Url
   */
  self.getiTunesUrl = function()
  {
    var appUrl = "http://itunes.apple.com/us/app/id524261279?l={locale}&ls=1&mt=8";
    appUrl = appUrl.replace("{locale}", Titanium.Platform.locale);
    return appUrl;
  }

  /**
 * Send email
 */
  self.sendEmail = function(name, email)
  {
    var emailDialog = Titanium.UI.createEmailDialog();

    if (emailDialog.isSupported())
    {
      emailDialog.toRecipients = [email];
      emailDialog.subject = "Find me!";
      emailDialog.html = true;

      var body = "Hi, " + name + "!<br><br>Follow my location @ <br>" +
      "<a href='" + self.getLink() + "'>" + self.getLink(true) + "</a><br><br>" +
      "Powered by <a href='" + self.getiTunesUrl() + "'>FindMe! App</a>";

      emailDialog.messageBody = body;
      emailDialog.open();
    }
    else // Email is not supported
    {
      mym.Utils.alert("Unable to send email.\nPehaps you have not set up a email acount?");
    }
  }

  /**
 * Send SMS
 */
  self.sendSms = function(phone)
  {
    var smsDialog = omorandi.createSMSDialog();

    if (smsDialog.isSupported())
    {
      var body = "Follow my location @ " + self.getLink();
      smsDialog.recipients = [phone];
      smsDialog.messageBody = body;
      smsDialog.open({
        animated: true
      });
    }
    else
    {
      mym.Utils.alert("Your device doesn't support SMS");
    }
  }
}