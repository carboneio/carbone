
const commonFormatFn = {
  Sv : (v, S, s, M, m, n) => {
    return `${S}${v}`; 
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
  }
};

// for compatibility with older versions
locales.fr = locales['fr-fr'];
locales.nl = locales['nl-nl'];
locales.en = JSON.parse(JSON.stringify(locales['en-us']));
locales.en.currency.code = 'EUR';
locales.en.currency.L = commonFormatFn.v_S;
module.exports = locales;
