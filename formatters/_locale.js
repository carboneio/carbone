/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */

const commonFormatFn = {
  Sv : (v, S, s, M, m, n) => {
    return `${S}${v}`;
  },
  S_v : (v, S, s, M, m, n) => {
    return `${S} ${v}`;
  },
  v_S : (v, S, s, M, m, n) => {
    return `${v} ${S}`;
  },
  v_M : (v, S, s, M, m, n) => {
    return `${v} ${M}`;
  },
  M : (v, S, s, M, m, n) => {
    return M;
  }
};

const locales = {
  'fr-fr' : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  'en-us' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.Sv,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'USD'
    }
  },
  'en-gb' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.Sv,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'GBP'
    }
  },
  'nl-nl' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.Sv,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  'nl-be' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  af : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'ZAR'
    }
  },
  sq : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'ALL'
    }
  },
  am : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'ETB'
    }
  },
  ar : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'DZD'
    }
  },
  'ar-dz' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'DZD'
    }
  },
  'ar-bh' : {
    number : {
      separator : '٬',
      decimal   : '٫',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'BHD'
    }
  },
  'ar-eg' : {
    number : {
      separator : '٬',
      decimal   : '٫',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EGP'
    }
  },
  'ar-iq' : {
    number : {
      separator : '٬',
      decimal   : '٫',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'IQD'
    }
  },
  'ar-jo' : {
    number : {
      separator : '٬',
      decimal   : '٫',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'JOD'
    }
  },
  'ar-kw' : {
    number : {
      separator : '٬',
      decimal   : '٫',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'KWD'
    }
  },
  'ar-lb' : {
    number : {
      separator : '٬',
      decimal   : '٫',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'LBP'
    }
  },
  'ar-ly' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'LYD'
    }
  },
  'ar-ma' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'MAD'
    }
  },
  'ar-om' : {
    number : {
      separator : '٬',
      decimal   : '٫',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'OMR'
    }
  },
  'ar-qa' : {
    number : {
      separator : '٬',
      decimal   : '٫',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'QAR'
    }
  },
  'ar-sa' : {
    number : {
      separator : '٬',
      decimal   : '٫',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'SAR'
    }
  },
  'ar-sy' : {
    number : {
      separator : '٬',
      decimal   : '٫',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'SYP'
    }
  },
  'ar-tn' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'TND'
    }
  },
  'ar-ae' : {
    number : {
      separator : '٬',
      decimal   : '٫',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'AED'
    }
  },
  'ar-ye' : {
    number : {
      separator : '٬',
      decimal   : '٫',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'YER'
    }
  },
  hy : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'AMD'
    }
  },
  'az-az' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'RUB'
    }
  },
  be : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'BYN'
    }
  },
  bn : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'BDT'
    }
  },
  bs : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'BAM'
    }
  },
  bg : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'BGN'
    }
  },
  my : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'MMK'
    }
  },
  'zh-cn' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'CNY'
    }
  },
  'zh-hk' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'HKD'
    }
  },
  'zh-mo' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'MOP'
    }
  },
  'zh-sg' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'SGD'
    }
  },
  'zh-tw' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'TWD'
    }
  },
  hr : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'HRK'
    }
  },
  cs : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'CZK'
    }
  },
  da : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'DKK'
    }
  },
  'en-au' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'AUD'
    }
  },
  'en-bz' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'BZD'
    }
  },
  'en-ca' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'CAD'
    }
  },
  'en-cb' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'XCD'
    }
  },
  'en-in' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'INR'
    }
  },
  'en-ie' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  'en-jm' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'JMD'
    }
  },
  'en-nz' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'NZD'
    }
  },
  'en-ph' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'PHP'
    }
  },
  'en-za' : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'ZAR'
    }
  },
  'en-tt' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'TTD'
    }
  },
  et : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  mk : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'MKD'
    }
  },
  fo : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'FOK'
    }
  },
  fa : {
    number : {
      separator : '٬',
      decimal   : '٫',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'IRR'
    }
  },
  fi : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  'fr-be' : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  'fr-ca' : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'CAD'
    }
  },
  'fr-lu' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  'fr-ch' : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'CHF'
    }
  },
  'gd-ie' : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  'de-at' : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  'de-de' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  'de-li' : {
    number : {
      separator : '’',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'CHF'
    }
  },
  'de-lu' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  'de-ch' : {
    number : {
      separator : '’',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.S_v,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'CHF'
    }
  },
  el : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  gn : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'PYG'
    }
  },
  he : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'ILS'
    }
  },
  hi : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'INR'
    }
  },
  hu : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'HUF'
    }
  },
  is : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'ISK'
    }
  },
  id : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'IDR'
    }
  },
  'it-it' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  'it-ch' : {
    number : {
      separator : '’',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'CHF'
    }
  },
  ja : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'JPY'
    }
  },
  kn : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'INR'
    }
  },
  kk : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'KZT'
    }
  },
  km : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'KHR'
    }
  },
  ko : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'KRW'
    }
  },
  lo : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'LAK'
    }
  },
  lv : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  lt : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'LTL'
    }
  },
  'ms-bn' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'BND'
    }
  },
  'ms-my' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'MYR'
    }
  },
  ml : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'MYR'
    }
  },
  mt : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  mi : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'NZD'
    }
  },
  mr : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'BDT'
    }
  },
  mn : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'MNT'
    }
  },
  ne : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'NPR'
    }
  },
  'no-no' : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'NOK'
    }
  },
  or : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'INR'
    }
  },
  pl : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'PLN'
    }
  },
  'pt-br' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.S_v,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'BRL'
    }
  },
  'pt-pt' : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  'ro-mo' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'MDL'
    }
  },
  ro : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'RON'
    }
  },
  ru : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'RUB'
    }
  },
  'ru-mo' : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'MDL'
    }
  },
  sa : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'MVR'
    }
  },
  'sr-sp' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'RUB'
    }
  },
  si : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'LKR'
    }
  },
  sk : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  sl : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  so : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'SOS'
    }
  },
  'es-ar' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'ARS'
    }
  },
  'es-bo' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'BOB'
    }
  },
  'es-cl' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'CLP'
    }
  },
  'es-co' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'COP'
    }
  },
  'es-cr' : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'CRC'
    }
  },
  'es-do' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'DOP'
    }
  },
  'es-ec' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'ECS'
    }
  },
  'es-sv' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'SVC'
    }
  },
  'es-gt' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'GTQ'
    }
  },
  'es-hn' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'HNL'
    }
  },
  'es-mx' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'MXN'
    }
  },
  'es-ni' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'NIO'
    }
  },
  'es-pa' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'PAB'
    }
  },
  'es-py' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'PYG'
    }
  },
  'es-pe' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'PEN'
    }
  },
  'es-pr' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'USD'
    }
  },
  'es-es' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  'es-uy' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'UYU'
    }
  },
  'es-ve' : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'VES'
    }
  },
  sw : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'TZS'
    }
  },
  'sv-fi' : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'EUR'
    }
  },
  'sv-se' : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'SEK'
    }
  },
  tg : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'TJS'
    }
  },
  ta : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'LKR'
    }
  },
  te : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'INR'
    }
  },
  th : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'THB'
    }
  },
  bo : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'CNY'
    }
  },
  ts : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'ZAR'
    }
  },
  tr : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'TRY'
    }
  },
  tk : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'TMT'
    }
  },
  uk : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'UAH'
    }
  },
  ur : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'PKR'
    }
  },
  'uz-uz' : {
    number : {
      separator : ',',
      decimal   : '.',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'UZS'
    }
  },
  vi : {
    number : {
      separator : '.',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'VND'
    }
  },
  cy : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'GBP'
    }
  },
  xh : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'ZAR'
    }
  },
  yi : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'ILS'
    }
  },
  zu : {
    number : {
      separator : ' ',
      decimal   : ',',
      group     : 3
    },
    currency : {
      L    : commonFormatFn.v_S,
      LL   : commonFormatFn.v_M,
      M    : commonFormatFn.M,
      code : 'ZAR'
    }
  }
};

// for compatibility with main language
locales.az = locales['az-az'];
locales.de = locales['de-de'];
locales.es = locales['es-es'];
locales.it = locales['it-it'];
locales.fr = locales['fr-fr'];
locales.nl = locales['nl-nl'];
locales.en = JSON.parse(JSON.stringify(locales['en-us']));
locales.en.currency.code = 'EUR';
locales.en.currency.L = commonFormatFn.v_S;
module.exports = locales;
