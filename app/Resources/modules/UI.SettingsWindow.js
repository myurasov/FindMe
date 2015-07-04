/**
 * Setting window
 */

Project.UI.createSettingsWindow = function()
{
  var view;
  var tableView;
  var sliderInterval;
  var labelInterval;
  var switchProx;
  var switchBgService;
  var rowSupport;
  var rowAbout;
  var rowHelp;
  var rowRate;

  function _createView()
  {
    view = Ti.UI.createWindow({
      title: 'Settings',
      barImage: "images/bar.png",
      barColor: Project.Config.get('_barColor'),
      backgroundImage: "images/bg.png",
      backgroundRepeat: true,
      barTintColor: '#fff',
      navTintColor: '#fff'
    });

    //

    view.add(tableView = Ti.UI.createTableView({
      style: Titanium.UI.iPhone.TableViewStyle.GROUPED,
      backgroundColor: "transparent"
    }));

    // Location update

    var s1 = Ti.UI.createTableViewSection({
      footerView: Project.UI.createHelpLabel({
        text: 'Minimum interval between location sharing.'
      })
    });

    var r;

    s1.add(r = Ti.UI.createTableViewRow({
      backgroundColor: "white",
      title: 'Location update interval'
    }));

    r.add(labelInterval = Ti.UI.createLabel({
      text: '',
      color: "#4c566c",
      textAlign: "right",
      right: 10,
      width: 100,
      height: 44
    }));

    s1.add(r = Ti.UI.createTableViewRow({
      backgroundColor: "white"
    }));

    r.add(sliderInterval = Ti.UI.createSlider({
      left: 10,
      right: 10,
      max: 60,
      min: 3,
      value: Project.Config.get('publishTimeout'),
      height: 44
    }));

    // Proximity sensor

    var s2 = Ti.UI.createTableViewSection({
      footerView: Project.UI.createHelpLabel({
        text: 'Turns screen off when iPhone is close to any surface. ' +
          'Map update is also paused. ' +
          'Used to save power and network traffic.',
        lines: 3
      })
    });

    s2.add(r = Ti.UI.createTableViewRow({
      title: 'Use proximity sensor',
      height: 44,
      backgroundColor: "white"
    }));

    r.add(switchProx = Titanium.UI.createSwitch({
      value: Project.Config.get('proximitySensor'),
      right: 10
    }))

    // Bg service

    var s3 = Ti.UI.createTableViewSection({
      footerView: Project.UI.createHelpLabel({
        text: 'Share your location while app is not active (up to 10 minutes).',
        lines: 2
      })
    });

    r = Ti.UI.createTableViewRow({
      title: 'Background service',
      backgroundColor: "white",
      height: 44
    });

    r.add(switchBgService = Titanium.UI.createSwitch({
      value: Project.Config.get('backgroundService'),
      right: 10
    }))

    s3.add(r);

    //

    var s4 = Ti.UI.createTableViewSection();
    s4.add(rowRate = Ti.UI.createTableViewRow({
      backgroundColor: "white",
      title: "Rate"
    }));
    s4.add(rowSupport = Ti.UI.createTableViewRow({
      backgroundColor: "white",
      title: "Get support"
    }));

    //

    var s5 = Ti.UI.createTableViewSection();

    s5.add(rowHelp = Ti.UI.createTableViewRow({
      backgroundColor: "white",
      title: "Help"
    }));

    s5.add(rowAbout = Ti.UI.createTableViewRow({
      backgroundColor: "white",
      title: "About"
    }));

    //

    tableView.setData([s1, s2, s3, s4, s5]);
  }

  function _attachEvents()
  {
    sliderInterval.addEventListener("change", function(e){
      Project.Config.set('publishTimeout', Math.round(e.value));
      labelInterval.text = Math.round(e.value) + ' sec';
      Project.application.publishLocation.interval = e.value * 1000;
      Project.application.saveConfig();
    });

    switchProx.addEventListener("change", function(e){
      Project.Config.set('proximitySensor', e.value);
      Titanium.App.proximityDetection = e.value;
      Project.application.saveConfig();
    });

    switchBgService.addEventListener("change", function(e){
      if (e.value)
        Project.application.registerBgService();
      else
        Project.application.unregisterBgService();

      Project.Config.set('backgroundService', e.value);
      Project.application.saveConfig();
    });

    rowAbout.addEventListener("click", function(e){
      var alertBox = Titanium.UI.createAlertDialog({
        title: Project.Config.get("appName") + " " + Ti.App.version,
        message: "© " + Ti.App.copyright
      });
      alertBox.show();
    });

    rowSupport.addEventListener("click", function(e){

        var emailDialog = Titanium.UI.createEmailDialog();

        if (emailDialog.isSupported()) {
          emailDialog.toRecipients = ["onmyway@yurasov.me"];
          emailDialog.subject = "App Support - onmyway";
          emailDialog.html = false;
          emailDialog.open();
        }

    });

    rowHelp.addEventListener("click", function(){
      Ti.Platform.openURL(Project.Config.get('_helpUrl'));
    });

    rowRate.addEventListener("click", function(){
      Ti.Platform.openURL(Project.application.getiTunesUrl());
      Project.Config.set("askedForRatingDone", 1).save();
    });

    view.addEventListener("open", function(){
      Project.application.mainWindow.setTitle("Back")
    });

    view.addEventListener("focus", function(){
      Project.application.mainWindow.setTitle("Back")
    });

    view.addEventListener("blur", function(){
      Project.application.mainWindow.setTitle(" ")
    });
  }

  _createView();
  _attachEvents();

  return view;
}