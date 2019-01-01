// pages/device/device.js
var app = getApp()
var temp = []
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isbluetoothready: false,
    defaultSize: 'default',
    primarySize: 'default',
    warnSize: 'default',
    disabled: false,
    plain: false,
    loading: false,
    searchingstatus: false,
    receivedata: '',
    onreceiving: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

  },

  switchBlueTooth: function() {
    var that = this

    that.setData({
      isbluetoothready: !that.data.isbluetoothready,
    })

    if (that.data.isbluetoothready) {
      wx.openBluetoothAdapter({
        success: function(res) {
          console.log("初始化蓝牙适配器成功");
          wx.onBluetoothAdapterStateChange(function(res) {
            console.log("蓝牙适配器状态变化", res)
            that.setData({
              isbluetoothready: res.available,
              searchingstatus: res.discovering
            })
          })
          wx.onBluetoothDeviceFound(function(data) {
            var devices = data.devices
            for (var i = 0; i < devices.length; i++) {
              var device = devices[i]
              var flag = true
              for (var j = 0; j < temp.length; j++) {
                console.log(temp[j])
                if (temp[j].deviceId == device.deviceId) {
                  flag = false
                }
              }
              if (flag) {
                console.log(device)
                temp.push(device)
              }
            }
            that.setData({
              devices: temp
            })

          })
        },
        fail: function(res) {
          console.log("初始化蓝牙适配器失败")
          wx.showModal({
            title: '提示',
            content: '请检查手机蓝牙是否打开',
            success: function(res) {
              that.setData({
                isbluetoothready: false,
                searchingstatus: false
              })
            }
          })
        }
      })
    } else {
      temp = []
      //先关闭设备连接
      wx.closeBLEConnection({
        deviceId: that.data.connectedDeviceId,
        complete: function(res) {
          console.log(res)
          that.setData({
            deviceconnected: false,
            connectedDeviceId: ""
          })
        }
      })
      wx.closeBluetoothAdapter({
        success: function(res) {
          console.log(res)
          that.setData({
            isbluetoothready: false,
            deviceconnected: false,
            devices: [],
            searchingstatus: false,
            receivedata: ''
          })
        },
        fail: function(res) {
          wx.showModal({
            title: '提示',
            content: '请检查手机蓝牙是否打开',
            success: function(res) {
              that.setData({
                isbluetoothready: false
              })
            }
          })
        }
      })
    }
  },
  searchbluetooth: function() {
    temp = []
    var that = this
    if (!that.data.searchingstatus) {
      var that = this
      wx.startBluetoothDevicesDiscovery({
        services: [],
        allowDuplicatesKey: false,
        success: function(res) {
          console.log("开始搜索附近蓝牙设备")
          console.log(res)
          that.setData({
            searchingstatus: !that.data.searchingstatus
          })
        }
      })
    } else {
      wx.stopBluetoothDevicesDiscovery({
        success: function(res) {
          console.log("停止蓝牙搜索")
          console.log(res)
        }
      })
    }
  },
  connectTO: function(e) {
    var that = this

    if (that.data.deviceconnected) {
      wx.notifyBLECharacteristicValueChanged({
        state: false, // 停用notify 功能
        deviceId: that.data.connectedDeviceId,
        serviceId: serviceId,
        characteristicId: characteristicId,
        success: function(res) {
          console.log("停用notify 功能")
        }
      })
      wx.closeBLEConnection({
        deviceId: e.currentTarget.id,
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
    } else {
      wx.showLoading({
        title: '连接蓝牙设备中...',
      })
      var deviceId = e.currentTarget.id
      console.log(deviceId);
      wx.redirectTo({
        url: '/pages/device/device?deviceId=' + deviceId,
      })
      wx.setStorage({
        key: "deviceId",
        data: deviceId
      })
      wx.stopBluetoothDevicesDiscovery({
        success: function(res) {
          console.log("停止蓝牙搜索")
          console.log(res)
        }
      })
    }
  },
  formSubmit: function(e) {
    console.log('form发生了submit事件，携带数据为：', e.detail.value.senddata)
    var senddata = e.detail.value.senddata;
    var that = this
    let buffer = new ArrayBuffer(32)
    let dataView = new DataView(buffer)
    dataView.setUint8(0, 5)
    dataView.setUint8(0, 2)
    dataView.setUint8(0, 0)
    dataView.setUint8(0, 0)
    wx.writeBLECharacteristicValue({
      deviceId: that.data.connectedDeviceId,
      serviceId: UUID_SERVICE,
      characteristicId: UUID_WRITE,
      value: buffer,
      success: function(res) {
        console.log(res)
        console.log('writeBLECharacteristicValue success', res.errMsg)
      }
    })
  },
  formReset: function() {
    console.log('form发生了reset事件')
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

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

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

function getNowFormatDate() {
  var date = new Date();
  var seperator1 = "-";
  var seperator2 = ":";
  var month = date.getMonth() + 1;
  var strDate = date.getDate();
  if (month >= 1 && month <= 9) {
    month = "0" + month;
  }
  if (strDate >= 0 && strDate <= 9) {
    strDate = "0" + strDate;
  }
  var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate +
    " " + date.getHours() + seperator2 + date.getMinutes() +
    seperator2 + date.getSeconds();
  return currentdate;
}