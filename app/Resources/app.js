var __DEBUG = true;
var __DEMO = false;

var Project = {
  UI: {}
};

// Titanium modules
var omorandi = require("com.omorandi");

// Libraries

Titanium.include(
  'lib/underscore.js',
  'lib/mym/Utils.js',
  'lib/mym/Configuration.js',
  'lib/mym/Mixins/EventsMixin.js',
  'lib/mym/UI/UI.HudMessage.js'
//  'lib/mym/UI/UI.AdOverlay.js',
//  'lib/mym/UI/UI.AdsHostWindow.js',
);

// Modules

Titanium.include(
 'modules/Utils.js',
 'modules/Config.js',
 'modules/Application.js',
 'modules/Messenger.js',
 'modules/UI.MainWindow.js',
 'modules/UI.SettingsWindow.js',
 'modules/UI.HelpLabel.js'
);

// Start application

Project.application = new Project.Application();
Project.application.init();