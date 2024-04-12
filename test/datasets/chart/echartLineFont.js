module.exports = {
  title : {
    subtext : 'Some text'
  },
  grid : {
    left         : '2%',
    right        : '3%',
    bottom       : '0%',
    containLabel : true
  },
  xAxis : {
    type        : 'category',
    boundaryGap : false,
    data        : [
      1,
      2,
      3
    ],
    axisLine : {
      onZero : false
    },
    axisLabel : {
      margin : 15
    },
    axisTick : {
      show : false
    }
  },
  yAxis : {
    type : 'value'
  },
  series : [
    {
      name       : 'Max',
      type       : 'line',
      symbolSize : 5,
      lineStyle  : {
        color : '#2769B6',
        type  : 'solid',
        width : 1.5
      },
      itemStyle : {
        color : '#2769B6'
      },
      label : {
        show            : true,
        position        : 'top',
        color           : '#373737',
        backgroundColor : 'transparent',
        fontFamily      : 'Courier New',
        fontSize        : 5,
        fontWeight      : 600,
        rich            : {
          labelMargin      : {},
          labelTerm        : {},
          labelMarginFinal : {}
        }
      },
      data : [
        72,
        39,
        38
      ],
      markLine : {
        symbol : [
          'none',
          'circle'
        ],
        symbolSize : 5,
        label      : {
          show : false
        },
        data : [
          {
            name      : 'Vertical Line',
            xAxis     : 4,
            lineStyle : {
              type  : 'solid',
              color : '#909090',
              width : 2
            }
          }
        ]
      },
      zlevel : 9999
    },
    {
      name       : 'Average',
      type       : 'line',
      symbolSize : 5,
      lineStyle  : {
        color : '#373737',
        type  : 'solid',
        width : 1.5
      },
      itemStyle : {
        color : '#373737'
      },
      data : [
        12,
        110,
        50
      ],
      zlevel : 1
    },
    {
      name       : 'Min',
      type       : 'line',
      symbolSize : 5,
      lineStyle  : {
        color : '#965553',
        type  : 'solid',
        width : 1.5
      },
      itemStyle : {
        color : '#965553'
      },
      label : {
        position        : 'bottom',
        show            : true,
        color           : '#373737',
        backgroundColor : 'transparent',
        fontFamily      : 'Arial',
        fontSize        : 14,
        fontWeight      : 600,
        rich            : {
          labelMargin      : {},
          labelTerm        : {},
          labelMarginFinal : {}
        }
      },
      data : [
        -39,
        -27,
        -21,
      ],
      zlevel : 9999
    }
  ]
};