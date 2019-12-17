var device = [];
Page({
  data: {
    device:device
  },
  /**
   * 初始化页面时获取蓝牙设备列表
   */
  onLoad: function() {
    //获取蓝牙设备列表
    this.getServices();
  },
  onHide: function () {
    // 页面从前台变为后台时执行
    wx.stopBluetoothDevicesDiscovery({
      success: function (res) {
        console.log('停止搜索设备', res)
      }
    })
  },
  onUnload: function () {
    // 页面销毁时执行
    wx.stopBluetoothDevicesDiscovery({
      success: function (res) {
        console.log('停止搜索设备', res)
      }
    })
  },
  /**
   * 下拉刷新页面
   */
  onPullDownRefresh: function(event) {
    //重新获取蓝牙设备列表
    this.getServices();
    wx.stopPullDownRefresh(); //停止当前页面的下拉刷新
  },
  /**
   * 获取蓝牙设备列表
   */
  getServices: function() {
    var that = this;
    /* 初始化蓝牙适配器 */
    wx.openBluetoothAdapter({
      success: function(res) {
        //开始搜寻附近的蓝牙外围设备
        wx.startBluetoothDevicesDiscovery({
          services: [],
          allowDuplicatesKey: false,
          success: function(res) {
            console.log(res)
            //寻找到新设备
            wx.onBluetoothDeviceFound(
              function(res) {
                console.log(res)
                /* 获取设备信号，判断信号强度 */
                var device_RSSI_1 = res.devices[0].RSSI;
                var device_RSSI_2 = Number(device_RSSI_1);
                var device_RSSI = Math.abs(device_RSSI_2);
                if (device_RSSI <= 60) {
                  var img = "../../images/signal4.png"
                } else if (device_RSSI > 60 && device_RSSI <= 70) {
                  var img = "../../images/signal3.png"
                } else if (device_RSSI > 70 && device_RSSI <= 80) {
                  var img = "../../images/signal2.png"
                } else if (device_RSSI > 80) {
                  var img = "../../images/signal1.png"
                }
                if (res.devices[0].name == "") {
                  var temp = {
                    ID: res.devices[0].deviceId,
                    name: "Unknow device",
                    RSSI: res.devices[0].RSSI,
                    img: img
                  }
                } else {
                  var temp = {
                    ID: res.devices[0].deviceId,
                    name: res.devices[0].name,
                    RSSI: res.devices[0].RSSI,
                    img: img
                  }
                }
                //插入数组按信号的强弱排序
                if (device.length == 0) {
                  device.push(temp);
                }
                for (let a = 0; a < device.length; a++) {
                  if (device[device.length - 1].RSSI > temp.RSSI) {
                    device.push(temp);
                    break;
                  }
                  if (device[a].RSSI < temp.RSSI) {
                    device.splice(a, 0, temp);
                    break;
                  }
                }
                that.setData({
                  device: device
                });
              });
          },
        });
      },
    })
  },

  /* 点击连接事件 */
  onLianTap: function(event) {
    wx.stopBluetoothDevicesDiscovery({
      success: function(res) {
        console.log('停止搜索设备', res)
      }
    })
    
    var title = event.currentTarget.dataset.deviceid;
    var name = event.currentTarget.dataset.devicename;
    wx.navigateTo({
      url: '../detail/detail?id=' + title + '&name=' + name
    })
  },
})