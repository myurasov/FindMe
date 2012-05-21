/**
 * Config
 */

Project.Config = new mym.Configuration({
  // channel name
  channel: Project.Utils.createUID(7),

  // timeout to publish messages
  publishTimeout: 15, // [s]

  // proximity sensor
  proximitySensor: true,

  // background service
  backgroundService: true,

  // last asked for rating date [timestamp]
  lastAskedForRatingDate: Date.now(),

  // asked for rating counters
  askedForRatingNo: 0,
  askedForRatingYes: 0,
  askedForRatingDone: 0,

  // ignored client uids
  ignoredClientUIDs: [],

  // watchers
  watchers: [],

  // title bar bg color
  _barColor: '#34b6d4',

  // help url
  _helpUrl: 'http://findme.ws/app-help.html'
}, "Config");