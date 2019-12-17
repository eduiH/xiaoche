// pages/detail/detail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    connect: false,
    send_hex: false,
    send_string: false,
    send_string_val: 'Ascii',
    recv_string: false,
    recv_string_val: 'Ascii',
    recv_value: 'ready',
    send_number: 0,
    recv_number: 0,
    recv_hex: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.stopBluetoothDevicesDiscovery({
      success: function(res) {
        console.log('停止搜索设备', res)
      }
    })
    console.log(options);
    this.setData({
      deviceId: options.id,
      deviceName: options.name
    });
    console.log('设备的ID', this.data.deviceId);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    wx.stopBluetoothDevicesDiscovery({
      success: function(res) {
        console.log('停止搜索设备', res)
      }
    })
    var that = this;
    /* 连接中动画 */
    if (!this.data.connect) {
      wx.showLoading({
        title: '连接中...',
      });
    }
    /* 开始连接蓝牙设备 */
    wx.createBLEConnection({
      deviceId: that.data.deviceId,
      success: function(res) {
        console.log('连接成功', res);
        wx.hideLoading();
        /* 获取设备的服务UUID */
        wx.getBLEDeviceServices({
          deviceId: that.data.deviceId,
          success: function(service) {
            var all_UUID = service.services; //取出所有的服务
            console.log('所有的服务', all_UUID);
            var UUID_lenght = all_UUID.length; //获取到服务数组的长度
            /* 遍历服务数组 */
            for (var index = 0; index < UUID_lenght; index++) {
              var ergodic_UUID = all_UUID[index].uuid; //取出服务里面的UUID
              var UUID_slice = ergodic_UUID.slice(4, 8); //截取4到8位
              /* 判断是否是我们需要的FEE0 */
              if (UUID_slice == 'FFE0' || UUID_slice == 'ffe0') {
                var index_uuid = index;
                that.setData({
                  serviceId: all_UUID[index_uuid].uuid //确定需要的服务UUID
                });
              };
            };
            console.log('需要的服务UUID', that.data.serviceId)
            that.Characteristics(); //调用获取特征值函数
          },
        });
        that.setData({
          connect: true
        })
      },
    })
  },
  Characteristics: function() {
    var that = this;
    var device_characteristics = [];
    var characteristics_uuid = {};
    wx.getBLEDeviceCharacteristics({
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      success: function(res) {
        var characteristics = res.characteristics; //获取到所有特征值
        var characteristics_length = characteristics.length; //获取到特征值数组的长度
        console.log('获取到特征值', characteristics);
        console.log('获取到特征值数组长度', characteristics_length);
        /* 遍历数组获取notycharacteristicsId */
        for (var index = 0; index < characteristics_length; index++) {
          var noty_characteristics_UUID = characteristics[index].uuid; //取出特征值里面的UUID
          var characteristics_slice = noty_characteristics_UUID.slice(4, 8); //截取4到8位
          /* 判断是否是我们需要的FEE1 */
          if (characteristics_slice == 'FFE1' || characteristics_slice == 'ffe1') {
            var index_uuid = index;
            that.setData({
              notycharacteristicsId: characteristics[index_uuid].uuid, //需确定要的使能UUID
              characteristicsId: characteristics[index_uuid].uuid //暂时确定的写入UUID
            });
            /* 遍历获取characteristicsId */
            for (var index = 0; index < characteristics_length; index++) {
              var characteristics_UUID = characteristics[index].uuid; //取出特征值里面的UUID
              var characteristics_slice = characteristics_UUID.slice(4, 8); //截取4到8位
              /* 判断是否是我们需要的FEE2 */
              if (characteristics_slice == 'FFE2' || characteristics_slice == 'ffe2') {
                var index_uuid = index;
                that.setData({
                  characteristicsId: characteristics[index_uuid].uuid //确定的写入UUID
                });
              };
            };
          };
        };
        console.log('使能characteristicsId', that.data.notycharacteristicsId);
        console.log('写入characteristicsId', that.data.characteristicsId);
        that.notycharacteristicsId(); //使能事件

      },
    })
  },

  /* 使能函数 */
  notycharacteristicsId: function() {
    var that = this;
    var recv_value_ascii = "";
    var string_value = "";
    var recve_value = "";
    wx.notifyBLECharacteristicValueChange({
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      characteristicId: that.data.notycharacteristicsId,
      state: true,
      success: function(res) {
        console.log('使能成功', res);
        /* 设备返回值 */
        wx.onBLECharacteristicValueChange(
          function(res) {
            var length_hex = [];
            var turn_back = "";
            var result = res.value;
            var hex = that.buf2hex(result);
            console.log('返回的值', hex);
            if (that.data.recv_string == true) {
              /* 成功接收到的值的展示 */
              that.setData({
                recv_value: that.data.recv_value + hex
              });
              /* 接收成功的值的字节 */
              var recv_number_1 = that.data.recv_number + hex.length / 2;
              var recv_number = Math.round(recv_number_1);
              that.setData({
                recv_number: recv_number
              });
            } else {
              console.log('设备返回来的值', hex);
              var f_hex = hex;
              var length_soy = f_hex.length / 2;
              var length = Math.round(length_soy);
              for (var i = 0; i < length; i++) {
                var hex_spalit = f_hex.slice(0, 2);
                length_hex.push(hex_spalit);
                f_hex = f_hex.substring(2);
              }
              console.log('length_hex', length_hex);
              for (var j = 0; j < length_hex.length; j++) {

                var integar = length_hex[j]; //十六进制
                recve_value = parseInt(integar, 16); //十进制
                console.log('recve_value', recve_value);

                turn_back = turn_back + String.fromCharCode(recve_value);
                console.log('turn_back', turn_back);
              }

              console.log('最终转回来的值', turn_back)
              var recv_number_1 = that.data.recv_number + turn_back.length;
              var recv_number = Math.round(recv_number_1);
              that.setData({
                recv_number: recv_number,
                recv_value: that.data.recv_value + turn_back
              })
            }
          });
      },

      fail: function(res) {
        console.log('使能失败', res);
      }
    })
  },



  /* 点击，Hex与Ascii相互转换(send) */
  ToString16: function() {
    var that = this;
    var send_string_judge = !that.data.send_string;
    that.setData({
      send_string: send_string_judge
    });
    if (that.data.send_string == true) {
      that.setData({
        send_string_val: 'Hex'
      });
    } else {
      that.setData({
        send_string_val: 'Ascii'
      })
    }
  },
  /* 点击，Hex与Ascii相互转换(recv) */
  RecvString16: function() {
    var that = this;
    var recv_string_judge = !that.data.recv_string;
    that.setData({
      recv_string: recv_string_judge
    });
    if (that.data.recv_string == true) {
      that.setData({
        recv_string_val: 'Hex'
      });
    } else {
      that.setData({
        recv_string_val: 'Ascii'
      })
    }
  },

  /* 发送数据 */
  SendData: function(value_initial_1) {
    var that = this;
    var write_array = [];
    var charCodeAt = [];
    var value_ascii = "";
    var recv_value_ascii = "";
    var string_value = "";
    var recve_value = "";
    //var value_initial_1 = that.data.send_value; //拿到输入框的值
    console.log('输入框中的值', value_initial_1);
    /* 判断是否存在空格 */
    if (value_initial_1.indexOf(' ') > 0) {
      var value_initial = that.splitStr(value_initial_1, ' '); //存在空格时
      console.log('删除掉空格', value_initial);
    } else {
      var value_initial = value_initial_1; //不存在空格时
    }


    /* 判断字节是否超过20字节 */
    if (value_initial.length > 20) { //当字节超过20的时候，采用分段发送
      if (that.data.send_string == true) { //选择16进制发送时
        var value_initial_exceed = value_initial; //将输入框的值取过来，方便循环
        var value_initial_average = Math.ceil(value_initial_exceed.length / 20);
        console.log('需要循环的次数', value_initial_average);
        for (var i = 0; i < value_initial_average; i++) {
          if (value_initial_exceed.length > 20) {
            var value_initial_send = value_initial_exceed.slice(0, 20); //截取前20个字节
            console.log('截取到的值', value_initial_send);
            value_initial_exceed = value_initial_exceed.substring(20); //value_initial_exceed替换为取掉前20字节后的数据
            write_array.push(value_initial_send); //将所有截取的值放在一个数组
          } else {
            write_array.push(value_initial_exceed);
          }
        }
        console.log('write_array数组', write_array);
        write_array.map(function(val, index) {
          setTimeout(function() {
            var value_set = val;
            console.log('value_set', value_set);
            var write_function = that.write(value_set); //调用数据发送函数
          }, index * 100)
        });
        /* 发送的值的字节 */
        var send_number_1 = that.data.send_number + value_initial.length / 2;
        var send_number = Math.floor(send_number_1);
        that.setData({
          send_number: send_number
        });
      } else { //选择Ascii码发送

        /* 当选择以Ascii字符发送的时候 */
        var value_split = value_initial.split(''); //将字符一个一个分开
        console.log('value_split', value_split);
        for (var i = 0; i < value_split.length; i++) {
          value_ascii = value_ascii + value_split[i].charCodeAt().toString(16); //转为Ascii字符后连接起
        }
        var Ascii_value = value_ascii;
        console.log('转为Ascii码值', Ascii_value);
        console.log('Ascii_value的长度', Ascii_value.length)
        var Ascii_send_time = Math.ceil(Ascii_value.length / 20);
        console.log('Ascii发送的次数', Ascii_send_time);
        for (var i = 0; i < Ascii_send_time; i++) {
          if (Ascii_value.length > 20) {
            var value = Ascii_value.slice(0, 20);
            console.log('截取到的值', value);
            Ascii_value = Ascii_value.substring(20);
            console.log('此时剩下的Ascii_value', Ascii_value);
            write_array.push(value); //放在数组里面
          } else {
            var value = Ascii_value;
            write_array.push(Ascii_value); //放在数组里面
          }
        }
        console.log('数组write_array', write_array);
        write_array.map(function(val, index) {
          setTimeout(function() {
            var value_set = val;
            console.log('value_set', value_set);
            var write_function = that.write(value_set); //调用数据发送函数
          }, index * 100)
        });
        /* 发送的值的字节 */
        var send_number_1 = that.data.send_number + value_initial.length;
        var send_number = Math.round(send_number_1);
        that.setData({
          send_number: send_number
        });
      }
    } else { //当字节不超过20的时候，直接发送
      /* 判断选择了Hex还是Ascii发送 */
      if (that.data.send_string == true) {
        /* 当选择了以Hex十六进制发送的时候 */
        var value = value_initial;
      } else {
        /* 当选择以Ascii字符发送的时候 */
        var value_split = value_initial.split(''); //将字符一个一个分开
        console.log('value_split', value_split);
        for (var i = 0; i < value_split.length; i++) {
          value_ascii = value_ascii + value_split[i].charCodeAt().toString(16); //转为Ascii字符后连接起
        }
        var value = value_ascii;
        console.log('转为Ascii码值', value);
      }
      var write_function = that.write(value); //调用数据发送函数
      /* 成功发送的值的字节 */
      if (that.data.send_string == true) {
        var send_number_1 = that.data.send_number + value_initial.length / 2;
        var send_number = Math.floor(send_number_1);
        that.setData({
          send_number: send_number
        });
      } else {
        var send_number_1 = that.data.send_number + value_initial.length;
        var send_number = Math.round(send_number_1);
        that.setData({
          send_number: send_number
        })
      }
    }
  },

  write: function(str) {
    var that = this;
    var value = str;
    console.log('value', value);
    /* 将数值转为ArrayBuffer类型数据 */
    var typedArray = new Uint8Array(value.match(/[\da-f]{2}/gi).map(function(h) {
      return parseInt(h, 16)
    }));
    var buffer = typedArray.buffer;
    wx.writeBLECharacteristicValue({
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      characteristicId: that.data.characteristicsId,
      value: buffer,
      success: function(res) {
        console.log('数据发送成功', res);
      },
      fail: function(res) {
        console.log('调用失败', res);
        /* 调用失败时，再次调用 */
        wx.writeBLECharacteristicValue({
          deviceId: that.data.deviceId,
          serviceId: that.data.serviceId,
          characteristicId: that.data.characteristicsId,
          value: buffer,
          success: function(res) {
            console.log('第2次数据发送成功', res);
          },
          fail: function(res) {
            console.log('第2次调用失败', res);
            /* 调用失败时，再次调用 */
            wx.writeBLECharacteristicValue({
              deviceId: that.data.deviceId,
              serviceId: that.data.serviceId,
              characteristicId: that.data.characteristicsId,
              value: buffer,
              success: function(res) {
                console.log('第3次数据发送成功', res);
              },
              fail: function(res) {
                console.log('第3次调用失败', res);
              }
            });
          }
        });
      }
    });
  },



  /* 去除输入框输入的值中的空格 */
  splitStr: function(str, s) {
    var newStr = "";
    var strArray = str.split(s);
    for (var i = 0; i < strArray.length; i++) {
      newStr += strArray[i];
    }
    return newStr;
  },

  /* 断开连接 */
  DisConnectTap: function() {
    var that = this;
    wx.closeBLEConnection({
      deviceId: that.data.deviceId,
      success: function(res) {
        console.log('断开设备连接', res);
        wx.reLaunch({
          url: '../index/index',
        })
      }
    });
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    var that = this;
    wx.closeBLEConnection({
      deviceId: that.data.deviceId,
      success: function(res) {
        console.log('断开设备连接', res);
      }
    });
  },
  /* 清除Send Bytes */
  CleanNumberSend: function() {
    this.setData({
      send_number: 0
    })
  },
  /* 清除Recv Bytes */
  CleanNumberRecv: function() {
    this.setData({
      recv_number: 0
    })
  },
  /* ArrayBuffer类型数据转为16进制字符串 */
  buf2hex: function(buffer) { // buffer is an ArrayBuffer
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
  },
  /**前进 */
  forward: function() {
    this.SendData("$" + "f" + "#");
    this.setData({
      recv_value: '',
      recv_number: 0
    });
  },
  /**后退 */
  back: function () {
    this.SendData("$" + "b" + "#");
    this.setData({
      recv_value: '',
      recv_number: 0
    });
  },
  /**左转 */
  turn_left: function () {
    this.SendData("$" + "l" + "#");
    this.setData({
      recv_value: '',
      recv_number: 0
    });
  },
  /**右转 */
  turn_right: function () {
    this.SendData("$" + "r" + "#");
    this.setData({
      recv_value: '',
      recv_number: 0
    });
  },
  /**停止 */
  stop: function () {
    this.SendData("$" + "s" + "#");
    this.setData({
      recv_value: '',
      recv_number: 0
    });
  },
  
  /**关关灯 */
  light: function () {
    this.SendData("$" + "o" + "#");
    this.setData({
      recv_value: '',
      recv_number: 0
    });
  },
  /**加速和减速 */
  acc:function(){
    this.SendData("$" + "c" + "#");
    this.setData({
      recv_value: '',
      recv_number: 0
    })
  },
  slo: function () {
    this.SendData("$" + "w" + "#");
    this.setData({
      recv_value: '',
      recv_number: 0
    });
  }
})