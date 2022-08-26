module.exports = {
  color : ['#80FFA3', '#00DDFF', '#37A2FF', '#FF0087', '#FFBF00'],
  title : {
    text : ''
  },
  legend : {
    data : ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5']
  },
  grid : {
    left         : '3%',
    right        : '4%',
    bottom       : '3%',
    containLabel : true
  },
  xAxis : [
    {
      type        : 'category',
      boundaryGap : false,
      data        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }
  ],
  yAxis : [
    {
      type : 'value'
    }
  ],
  series : [
    {
      name      : 'Line 1',
      type      : 'line',
      stack     : 'Total',
      smooth    : true,
      lineStyle : {
        width : 0
      },
      showSymbol : false,
      areaStyle  : {
        opacity : 0.8
      },
      emphasis : {
        focus : 'series'
      },
      data : [140, 232, 101, 264, 90, 340, 250]
    },
    {
      name      : 'Line 2',
      type      : 'line',
      stack     : 'Total',
      smooth    : true,
      lineStyle : {
        width : 0
      },
      showSymbol : false,
      areaStyle  : {
        opacity : 0.8
      },
      emphasis : {
        focus : 'series'
      },
      data : [220, 182, 811, 234, 220, 340, 310]
    },
    {
      name      : 'Line 3',
      type      : 'line',
      stack     : 'Total',
      smooth    : true,
      lineStyle : {
        width : 0
      },
      showSymbol : false,
      areaStyle  : {
        opacity : 0.8
      },
      emphasis : {
        focus : 'series'
      },
      data : [320, 132, 201, 334, 190, 130, 220]
    },
    {
      name      : 'Line 4',
      type      : 'line',
      stack     : 'Total',
      smooth    : true,
      lineStyle : {
        width : 0
      },
      showSymbol : false,
      areaStyle  : {
        opacity : 0.8
      },
      emphasis : {
        focus : 'series'
      },
      data : [220, 402, 231, 134, 190, 230, 120]
    },
    {
      name      : 'Line 5',
      type      : 'line',
      stack     : 'Total',
      smooth    : true,
      lineStyle : {
        width : 0
      },
      showSymbol : false,
      label      : {
        show     : true,
        position : 'top'
      },
      areaStyle : {
        opacity : 0.8
      },
      emphasis : {
        focus : 'series'
      },
      data : [220, 302, 181, 234, 210, 290, 150]
    }
  ]
};