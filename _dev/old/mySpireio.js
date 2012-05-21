/**
 * Spire.io stuff
 */

Project.mySpirieo = function()
{
  self = this;

  var description;
  var channelName;

  /**
   * Creates channel with random name
   */
  self.createChannel = function(doneCallback)
  {
    // discovery
    var xhr = Titanium.Network.createHTTPClient();
    xhr.open('GET', 'http://api.spire.io/');
    xhr.setRequestHeader('accept', 'application/json');

    xhr.setOnload(function(){
      description = JSON.parse(this.responseText);

      // session
      var xhr = Titanium.Network.createHTTPClient();
      xhr.open('POST', description.resources.sessions.url);
      xhr.setRequestHeader('accept', description.schema["1.0"].session.mediaType);
      xhr.setRequestHeader('content-type', description.schema["1.0"].account.mediaType);

      xhr.setOnload(function(){
        var response = JSON.parse(this.responseText);
        description.resources.session = response;

        // channels
        var xhr = Titanium.Network.createHTTPClient();
        xhr.open('POST', description.resources.session.resources.channels.url);
        xhr.setRequestHeader('accept', description.schema["1.0"].channel.mediaType);
        xhr.setRequestHeader('content-type', description.schema["1.0"].channel.mediaType);
        xhr.setRequestHeader('authorization', "Capability " +
          description.resources.session.resources.channels.capabilities.create);

        channelName = Project.Utils.createId(32);

        xhr.setOnload(function(){
          // got channel!
          description.resources.channels = {};
          description.resources.channels[channelName] =
            JSON.parse(this.responseText);

          if (doneCallback != undefined)
            doneCallback();
        });

        xhr.setOnerror(function(){
          if (this.status == 409)
            throw "Channel exists";
        });

        xhr.send(JSON.stringify({name: channelName}));
        // /channels
      });

      xhr.send(JSON.stringify({
        secret: Project.Config.spireioSecret
      }));
      // /session
    });

    xhr.send();
    // /discovery
  }

  /**
   * Publishes message
   */
  self.publishMessage = function(messageStr, doneCallback)
  {
    var xhr = Titanium.Network.createHTTPClient();
    xhr.open('POST', description.resources.channels[channelName].url);
    xhr.setRequestHeader('accept', description.schema["1.0"].channel.mediaType);
    xhr.setRequestHeader('content-type', description.schema["1.0"].channel.mediaType);
    xhr.setRequestHeader('authorization', "Capability " +
      description.resources.channels[channelName].capabilities.publish);

    xhr.setOnload(function(){
      if (doneCallback != undefined)
        doneCallback();
    });

    xhr.send(JSON.stringify({content: messageStr}));
  }

  self.subscribe = function(doneCallback)
  {
    var xhr = Titanium.Network.createHTTPClient();
    xhr.open('POST', description.resources.session.resources.subscriptions.url); //
    xhr.setRequestHeader('accept', description.schema["1.0"].subscription.mediaType); //
    xhr.setRequestHeader('content-type', description.schema["1.0"].subscription.mediaType); //
    xhr.setRequestHeader('authorization', "Capability " +
      description.resources.session.resources.subscriptions.capabilities.create); //

    xhr.setOnload(function(){

      alert(this.status); // 406???

      description.resources.subscription = JSON.parse(this.responseData);

      if (doneCallback != undefined)
        doneCallback();
    });

    xhr.send(JSON.stringify({
      channels: [description.resources.channels[channelName].url]
    })); //
  }

  self.getMessages = function(doneCallback)
  {

  }

  self.getChannelName = function()
  {
    return channelName;
  }

  self.getDescription = function()
  {
    return description;
  }
}
