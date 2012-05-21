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

  function _createView()
  {
    view = Ti.UI.createWindow({
      title: 'Settings',
      barImage: "images/bar.png",
      barColor: Project.Config.get('_barColor')
    });

    //

    view.add(tableView = Ti.UI.createTableView({
      style: Titanium.UI.iPhone.TableViewStyle.GROUPED,
       backgroundImage: "images/bg.png",
       backgroundRepeat: true
    }));

    // Location update

    var s1 = Ti.UI.createTableViewSection({
      footerView: Project.UI.createHelpLabel({
        text: 'Minimum interval between location sharing.'
      })
    });

    var r;

    s1.add(r = Ti.UI.createTableViewRow({
      title: 'Location update interval'
    }));

    r.add(labelInterval = Ti.UI.createLabel({
      text: '',
      color: "#4c566c",
      textAlign: "right",
      right: 10,
      width: 100,
      height: 44
    }))

    s1.add(r = Ti.UI.createTableViewRow());

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
        text: 'Turns screen off when iPhone is close to any surface. Used to save power.',
        lines: 2
      })
    });

    s2.add(r = Ti.UI.createTableViewRow({
      title: 'Use proximity sensor',
      height: 44
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
      height: 44
    });

    r.add(switchBgService = Titanium.UI.createSwitch({
      value: Project.Config.get('backgroundService'),
      right: 10
    }))

    s3.add(r);

    //

    var s4 = Ti.UI.createTableViewSection();

    s4.add(rowHelp = Ti.UI.createTableViewRow({
      title: "Help..."
    }));

    s4.add(rowSupport = Ti.UI.createTableViewRow({
      title: "Support..."
    }));

    s4.add(rowAbout = Ti.UI.createTableViewRow({
      title: "About..."
    }));

    //

    tableView.setData([s1, s2, s3, s4]);
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
        title: Ti.App.name + " " + Ti.App.version,
        message: "© " + Ti.App.copyright
      });
      alertBox.show();
    });

    rowSupport.addEventListener("click", function(e){
      Ti.Platform.openURL(Ti.App.url);
    });

    rowHelp.addEventListener("click", function(){
      Ti.Platform.openURL(Project.Config.get('_helpUrl'));
    });

    view.addEventListener("open", function(){
      Project.application.mainWindow.setTitle('Find me!')
    });

    view.addEventListener("blur", function(){
      Project.application.mainWindow.setTitle(' ')
    });
  }

  _createView();
  _attachEvents();

  return view;
}