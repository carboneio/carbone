// https://github.com/wiredmax/world-currencies
// https://www.currency-iso.org/dam/downloads/lists/list_one.xml
// https://github.com/mledoze/countries

module.exports = {
  EUR : { major : 'euro'   , symbol : '€'  , precision : 2 , minor : 'cent'  , minSymbol : 'c'  , name : 'Euros'         },
  USD : { major : 'dollar' , symbol : '$'  , precision : 2 , minor : 'cent'  , minSymbol : '¢'  , name : 'US Dollar'     },
  GBP : { major : 'pound'  , symbol : '£'  , precision : 2 , minor : 'penny' , minSymbol : 'p'  , name : 'British Pound' },
  CHF : { major : 'franc'  , symbol : 'CHF', precision : 2 , minor : 'rappen', minSymbol : 'Rp.', name : 'Swiss Franc'   }
};