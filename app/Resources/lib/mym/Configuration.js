if (typeof mym == "undefined") var mym = {};

// does not save properties beginning with _

mym.Configuration = function(defaults, keyName)
{
  var data = defaults;
  var _keyName = keyName || null;

  this.get = function(setting)
  {
    if (typeof setting == "undefined")
    {
      return data;
    }
    else
    {
        return data[setting];
    }
  }

  this.set = function(setting, value)
  {
    data[setting] = value;
    return this;
  }

  this.save = function()
  {
    if (_keyName !== null)
    {
      var saveData = _.clone(data);

      _.each(data, function(val, key){

        if (key.substr(0, 1) == "_")
        {
          delete saveData[key];
        }
        else
        {
          // Convert dates
          if (_.isDate(val))
          {
            saveData[key] = val.toString();
          }
        }
      });

      var saveData = JSON.stringify(saveData);
      Titanium.App.Properties.setString(_keyName, saveData);
    }

    return this;
  }

  this.load = function()
  {
    if (_keyName !== null)
    {
      var loadedData = Titanium.App.Properties.getString(_keyName);
      loadedData = JSON.parse(loadedData);
      if (loadedData === null) loadedData = {};
      _.defaults(loadedData, data);
      data = loadedData;
    }

    return this;
  }

  this.load();
}