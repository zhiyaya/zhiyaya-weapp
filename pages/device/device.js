// pages/device/device.js
var UUID_SERVICE = "0003CDD0-0000-1000-8000-00805F9B0131"
var UUID_NOTIFY = "0003CDD1-0000-1000-8000-00805F9B0131"
var UUID_WRITE = "0003CDD2-0000-1000-8000-00805F9B0131"
var deviceId = "";
var touch = 0
var continuouslyTouch = 0

var paperworks = [
  [
    "你猜，多肉的梦是什么颜色的？",
    "熬夜看星星，需要补个觉",
    "睡个美容觉，醒来又是元气美少女",
    "寂寞空庭春欲晚，梨花满地不开门",
    "你来或不来，都在我梦里"
  ],
  [
    "好朋友，快快靠近我，我想跟你说个小秘密",
    "我梦到你的笑，睁眼亲吻你的手",
    "我猜你一定有世界上最好看的手，不然怎么能抚摸得如此温柔",
    "你难道是我的骑士，手握长剑守卫熟睡的我",
    "我猜你是不舍我睡去，好与我彻夜长谈"
  ],
  [
    "你不过用指尖轻轻触碰了我，我却幸福地全身颤抖",
    "如果你驯服了我，我们就会彼此需要",
    "来呀来呀，一起摇摆~",
    "Skr~这是我的swag style~",
    "别挠我痒痒，我不要面子的嘛！"
  ]
]
Page({

  /**
   * 页面的初始数据
   */
  data: {
    light_data: 0,
    temp_data: 0,
    water_data: 0,
    air_data: 0,
    status: 0,
    night: false,
    paperwork: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this;
    var i = 1;
    this.timer = setInterval(function() {
      i++;
      var status = that.data.status
      if (status == 0) {
        i = i % 10;
      } else if (status == 1) {
        i = i % 9;
      } else if (status == 2) {
        i = i % 2;
      }
      that.setData({
        j: i
      })
      return
    }, 200);
    deviceId = options.deviceId
  


  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    var that = this;
    wx.openBluetoothAdapter({
      success: function (res) {
        console.log("初始化蓝牙适配器成功");
        wx.onBluetoothAdapterStateChange(function (res) {
          console.log("蓝牙适配器状态变化", res)
        })
        wx.createBLEConnection({
          deviceId: deviceId,
          success: function (res) {
            wx.hideLoading()
            wx.showToast({
              title: '连接成功',
              icon: 'success',
              duration: 1000
            })
            console.log("连接设备成功")
            console.log(res)
            //获取service
            wx.getBLEDeviceServices({
              deviceId: deviceId,
              success: function (res) {
                console.log(res)
                //获取Characteristics
                wx.getBLEDeviceCharacteristics({
                  deviceId: deviceId,
                  serviceId: UUID_SERVICE,
                  success: function (res) {
                    console.log(res)
                    //开启notify
                    wx.notifyBLECharacteristicValueChanged({
                      state: true, // 启用 notify 功能
                      deviceId: deviceId,
                      serviceId: UUID_SERVICE,
                      characteristicId: UUID_NOTIFY,
                      success: function (res) {
                        console.log("启用notify")
                        //开启接受
                        wx.onBLECharacteristicValueChange(function (res) {
                          console.log(ab2hex(res.value))
                          var bytes = new Uint8Array(res.value);
                          var newTouch = (bytes[14] & 0xFF) << 8 | (bytes[13] & 0xFF)
                          var status = -1
                          if (newTouch > touch) {
                            if (continuouslyTouch <= 6) {
                              continuouslyTouch += 2;
                            }
                            if (continuouslyTouch > 5) {
                              status = 2
                            } else {
                              status = 1
                            }
                          } else {
                            if (continuouslyTouch > 0) {
                              continuouslyTouch--;
                            }
                            if (continuouslyTouch == 0) {
                              status = 0
                            }
                          }
                          touch = newTouch
                          console.log(status)
                          console.log(continuouslyTouch)
                          if (status >= 0 && status != that.data.status) {
                            that.setData({
                              status: status,
                              paperwork: getRandomArrayElements(paperworks[status], 1)[0]
                            })
                          }
                          var light = (bytes[4] & 0xFF) << 8 | (bytes[3] & 0xFF)
                          that.setData({
                            light_data: light,
                            temp_data: (((bytes[6] & 0xFF) << 8 | (bytes[5] & 0xFF)) / 100.0),
                            water_data: (bytes[8] & 0xFF) << 8 | (bytes[7] & 0xFF),
                            air_data: (bytes[12] & 0xFF) << 8 | (bytes[11] & 0xFF),
                            night: light < 25
                          })
                        })
                      },
                      fail: function (res) {
                        console.log(res)
                      }
                    })
                  }
                })
              }
            })

            setInterval(function () {
              let buffer = new ArrayBuffer(32)
              let dataView = new DataView(buffer)
              dataView.setUint8(0, 5)
              dataView.setUint8(1, 2)
              dataView.setUint8(2, 0)
              dataView.setUint8(3, 0)
              wx.writeBLECharacteristicValue({
                deviceId: deviceId,
                serviceId: UUID_SERVICE,
                characteristicId: UUID_WRITE,
                value: buffer,
                success: function (res) {
                  console.log(res)
                }
              })
            }, 500)
          },
          fail: function (res) {
            wx.hideLoading()
            wx.showToast({
              title: '连接设备失败',
              icon: 'success',
              duration: 1000
            })
            console.log("连接设备失败")
            console.log(res)
          }
        })
      },
      fail: function (res) {
        console.log("初始化蓝牙适配器失败")
        wx.showModal({
          title: '提示',
          content: '请检查手机蓝牙是否打开',
          success: function (res) {

          }
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    wx.notifyBLECharacteristicValueChanged({
      state: false, // 停用notify 功能
      deviceId: deviceId,
      serviceId: UUID_SERVICE,
      characteristicId: UUID_NOTIFY,
      success: function (res) {
        console.log("停用notify 功能")
      }
    })
    wx.closeBLEConnection({
      deviceId: deviceId,
      complete: function (res) {
        console.log("断开设备")
        console.log(res)
        that.setData({
          deviceconnected: false,
          connectedDeviceId: "",
          receivedata: ""
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    var that = this;
    wx.notifyBLECharacteristicValueChanged({
      state: false, // 停用notify 功能
      deviceId: deviceId,
      serviceId: UUID_SERVICE,
      characteristicId: UUID_NOTIFY,
      success: function(res) {
        console.log("停用notify 功能")
      }
    })
    wx.closeBLEConnection({
      deviceId: deviceId,
      complete: function(res) {
        console.log("断开设备")
        console.log(res)
        that.setData({
          deviceconnected: false,
          connectedDeviceId: "",
          receivedata: ""
        })
      }
    })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})

function ab2hex(buffer) {
  let hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function(bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}

function getRandomArrayElements(arr, count) {
  var shuffled = arr.slice(0),
    i = arr.length,
    min = i - count,
    temp, index;
  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(min);
}