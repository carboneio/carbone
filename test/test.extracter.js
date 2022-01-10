var extracter = require('../lib/extracter');
var helper = require('../lib/helper');
var assert = require('assert');

describe('extracter', function () {


  describe('splitMarkers', function () {
    it('should return an empty descriptor if there are no markers', function () {
      var _markers = [];
      helper.assert(extracter.splitMarkers(_markers), {});
    });
    it('should create a descriptor which be used to build the xml generator', function () {
      var _markers = [
        {pos : 20, name : 'd.site'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : [
            {attr : 'site', formatters : [], obj : 'd', pos : 20, posOrigin : 20}
          ]
        }
      });
    });
    it('should detect multiple attributes', function () {
      var _markers = [
        {pos : 20, name : 'd.site'},
        {pos : 30, name : 'd.name'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : [
            {attr : 'site', formatters : [], obj : 'd', pos : 20, posOrigin : 20},
            {attr : 'name', formatters : [], obj : 'd', pos : 30, posOrigin : 30}
          ]
        }
      });
    });
    it('should accept two levels of object', function () {
      var _markers = [
        {pos : 20, name : 'd.site.name'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        dsite : {
          name     : 'site',
          type     : 'object',
          parent   : 'd',
          parents  : ['d'],
          xmlParts : [
            {attr : 'name', formatters : [], obj : 'dsite', pos : 20, posOrigin : 20},
          ]
        }
      });
    });
    it('should go up to parent object if two points ".." are used', function () {
      var _markers = [
        {pos : 20, name : 'd.site..name'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d     : { name : 'd'    , type : 'object', parent : '' , parents : []   ,  xmlParts : [] },
        dsite : { name     : 'site' , type     : 'object', parent   : 'd', parents  : ['d'],  xmlParts : [
          {attr : 'name', formatters : [], obj : 'd', pos : 20, posOrigin : 20},
        ]
        }
      });
    });
    it('should go up to parent object and if two points ".." are used', function () {
      var _markers = [
        {pos : 20, name : 'd.site..other.sub.name'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d     : { name : 'd'    , type : 'object', parent : '' , parents : []   ,  xmlParts : [] },
        dsite : { name     : 'site' , type     : 'object', parent   : 'd', parents  : ['d'],  xmlParts : [
          {attr : 'name', formatters : [], obj : 'dothersub', pos : 20, posOrigin : 20},
        ]
        },
        dother    : { name : 'other', type : 'object', parent : 'd'      , parents : ['d']           ,  xmlParts : [] },
        dothersub : { name : 'sub'  , type : 'object', parent : 'dother' , parents : ['d', 'dother'] ,  xmlParts : [] }
      });
    });
    it('should go up to third parent if four points "...." are used', function () {
      var _markers = [
        {pos : 20, name : 'd.site.car.wheel.tyre....name'}
      ];
      var _result = extracter.splitMarkers(_markers);
      helper.assert(_result.d.xmlParts, []);
      helper.assert(_result.dsite.xmlParts, []);
      helper.assert(_result.dsitecar.xmlParts, []);
      helper.assert(_result.dsitecarwheel.xmlParts, []);
      helper.assert(_result.dsitecarwheeltyre.xmlParts, [
        {attr : 'name', formatters : [], obj : 'dsite', pos : 20, posOrigin : 20}
      ]);
    });
    it('should go up in hierarchy even with an array', function () {
      var _markers = [
        {pos : 20, name : 'd.site.car[i]..name'},
        {pos : 24, name : 'd.site.car[i+1]..name'}
      ];
      var _result = extracter.splitMarkers(_markers);
      helper.assert(_result.d.xmlParts, []);
      helper.assert(_result.dsite.xmlParts, []);
      helper.assert(_result.dsitecar.xmlParts, [
        {attr : 'name', formatters : [], obj : 'dsite', pos : 20, posOrigin : 20}
      ]);
    });
    it('should go up in hierarchy, and set parents of rootdsub', function () {
      // root.d.cars[i]..who.name
      var _markers = [
        {pos : 20, name : 'root.d.car[i]..sub.name'},
        {pos : 24, name : 'root.d.car[i+1]..sub.name'}
      ];
      var _result = extracter.splitMarkers(_markers);
      helper.assert(_result.root.xmlParts, []);
      helper.assert(_result.rootd.xmlParts, []);
      helper.assert(_result.rootdcar.xmlParts, [
        {attr : 'name', formatters : [], obj : 'rootdsub', pos : 20, posOrigin : 20}
      ]);
      helper.assert(_result.rootdsub.xmlParts, []);
      helper.assert(_result.rootdsub.parent, 'rootd');
      helper.assert(_result.rootdsub.parents, ['root', 'rootd']);
    });
    it('should go up in hierarchy even with two arrays', function () {
      var _markers = [
        {pos : 20, name : 'd.site.car[i].wheel[i]..name'},
        {pos : 24, name : 'd.site.car[i+1].wheel[i+1]..name'}
      ];
      var _result = extracter.splitMarkers(_markers);
      helper.assert(_result.d.xmlParts, []);
      helper.assert(_result.dsite.xmlParts, []);
      helper.assert(_result.dsitecar.xmlParts, []);
      helper.assert(_result.dsitecarwheel.xmlParts, [
        {attr : 'name', formatters : [], obj : 'dsitecar', pos : 20, posOrigin : 20}
      ]);
    });
    it('should go up in hierarchy up to the root, even with two arrays', function () {
      var _markers = [
        {pos : 20, name : 'd.site.car[i].wheel[i]....name'},
        {pos : 24, name : 'd.site.car[i+1].wheel[i+1]....name'}
      ];
      var _result = extracter.splitMarkers(_markers);
      helper.assert(_result.d.xmlParts, []);
      helper.assert(_result.dsite.xmlParts, []);
      helper.assert(_result.dsitecar.xmlParts, []);
      helper.assert(_result.dsitecarwheel.xmlParts, [
        {attr : 'name', formatters : [], obj : 'd', pos : 20, posOrigin : 20}
      ]);
    });
    it('should go up in hierarchy up to the root, even with two arrays, and go down', function () {
      var _markers = [
        {pos : 20, name : 'd.site.car[i].wheel[i]...name.sub.id'},
        {pos : 24, name : 'd.site.car[i+1].wheel[i+1]...name.sub.id'}
      ];
      var _result = extracter.splitMarkers(_markers);
      helper.assert(_result.d.xmlParts, []);
      helper.assert(_result.dsite.xmlParts, []);
      helper.assert(_result.dsitecar.xmlParts, []);
      helper.assert(_result.dsitecarwheel.xmlParts, [
        {attr : 'id', formatters : [], obj : 'dsitenamesub', pos : 20, posOrigin : 20}
      ]);
      helper.assert(_result.dsitename.xmlParts, []);
      helper.assert(_result.dsitename.parent, 'dsite');
      helper.assert(_result.dsitenamesub.xmlParts, []);
      helper.assert(_result.dsitenamesub.parent, 'dsitename');
    });
    it('should throw an error if we go up to high with ".."', function () {
      var _markers = [
        {pos : 20, name : 'd.site...name'}
      ];
      assert.throws(
        () => {
          extracter.splitMarkers(_markers);
        },
        (err) => {
          helper.assert(err instanceof Error, true);
          helper.assert(err.toString(), 'Error: Cannot access parent object in "d.site...name" (too high)');
          return true;
        }
      );
    });
    it('should accept two levels of object and many attributes', function () {
      var _markers = [
        {pos : 10, name : 'd.movie'},
        {pos : 20, name : 'd.site.name'},
        {pos : 30, name : 'd.site.id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : [
            {attr : 'movie', formatters : [], obj : 'd', pos : 10, posOrigin : 10}
          ]
        },
        dsite : {
          name     : 'site',
          type     : 'object',
          parent   : 'd',
          parents  : ['d'],
          xmlParts : [
            {attr : 'name', formatters : [], obj : 'dsite', pos : 20, posOrigin : 20},
            {attr : 'id'  , formatters : [], obj : 'dsite', pos : 30, posOrigin : 30}
          ]
        }
      });
    });
    it('should manage arrays', function () {
      var _markers = [
        {pos : 20, name : 'd[i].site'},
        {pos : 30, name : 'd[i+1].site'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name      : 'd',
          type      : 'array',
          parent    : '',
          parents   : [],
          position  : { start : 20, end : 30 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'site', formatters : [], obj : 'd', pos : 20, posOrigin : 20}
          ]
        }
      });
    });
    it('should manage arrays with custom iterator', function () {
      var _markers = [
        {pos : 20, name : 'd[ sort ].site'},
        {pos : 30, name : 'd[ sort + 1].site'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name      : 'd',
          type      : 'array',
          parent    : '',
          parents   : [],
          position  : { start : 20, end : 30 },
          iterators : [{ attr : 'sort' }],
          xmlParts  : [
            {attr : 'site', formatters : [], obj : 'd', pos : 20, posOrigin : 20}
          ]
        }
      });
    });
    it('should detect iterator', function () {
      var _markers = [
        {pos : 20, name : 'd[ i ].site'},
        {pos : 30, name : 'd[ i + 1].site'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name      : 'd',
          type      : 'array',
          parent    : '',
          parents   : [],
          position  : { start : 20, end : 30 },
          iterators : [{attr : 'i'}],
          xmlParts  : [
            {attr : 'site', formatters : [], obj : 'd', pos : 20, posOrigin : 20}
          ]
        }
      });
    });
    it('AAAshould manage arrays with custom iterator', function () {
      var _markers = [
        {pos : 20, name : 'd[ i , sort ].site'},
        {pos : 30, name : 'd[ i + 1, sort + 1 ].site'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name      : 'd',
          type      : 'array',
          parent    : '',
          parents   : [],
          position  : { start : 20, end : 30 },
          iterators : [{attr : 'i'},{attr : 'sort'}],
          xmlParts  : [
            {attr : 'site', formatters : [], obj : 'd', pos : 20, posOrigin : 20}
          ]
        }
      });
    });
    it('should manage arrays and detect that the iterator is within a sub-object.\
        it should ignore whitespaces', function () {
      var _markers = [
        {pos : 20, name : 'd[ movie.sort ].site'},
        {pos : 30, name : 'd[ movie . sort   +1].site'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name      : 'd',
          type      : 'array',
          parent    : '',
          parents   : [],
          position  : { start : 20, end : 30 },
          iterators : [{obj : 'movie', attr : 'sort'}],
          xmlParts  : [
            {attr : 'site', formatters : [], obj : 'd', pos : 20, posOrigin : 20}
          ],
        }
      });
    });
    it('should manage arrays with nested objects', function () {
      var _markers = [
        {pos : 20, name : 'd[i].site.id'},
        {pos : 25, name : 'd[i].movie'},
        {pos : 30, name : 'd[i+1].site.id'},
        {pos : 35, name : 'd[i+1].movie'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name      : 'd',
          type      : 'array',
          parent    : '',
          parents   : [],
          position  : { start : 20, end : 30 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'movie', formatters : [], obj : 'd', pos : 25, posOrigin : 25}
          ]
        },
        dsite : {
          name     : 'site',
          type     : 'object',
          parent   : 'd',
          parents  : ['d'],
          xmlParts : [
            {attr : 'id', formatters : [], obj : 'dsite', pos : 20, posOrigin : 20}
          ]
        }
      });
    });
    it('should manage arrays within an object', function () {
      var _markers = [
        {pos : 20, name : 'd.site[i].id'},
        {pos : 30, name : 'd.site[i+1].id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        dsite : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 20, end : 30 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dsite', pos : 20, posOrigin : 20}
          ]
        }
      });
    });
    it('should manage arrays with conditions. It should transform = to ==', function () {
      var _markers = [
        {pos : 20, name : 'd.site[i=1].id'},
        {pos : 30, name : 'd.site[i=0].id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        // eslint-disable-next-line
        dsitei__1 : {
          name      : 'site',
          type      : 'objectInArray',
          parent    : 'd',
          parents   : ['d'],
          position  : {},
          iterators : [],
          xmlParts  : [
            { attr : 'id', formatters : [], obj : 'dsitei__1', pos : 20, posOrigin : 20 }
          ],
          conditions : [
            { left : { parent : 'dsitei__1',  attr : 'i' }, operator : '==', right : '1' }
          ]
        },
        // eslint-disable-next-line
        dsitei__0 : {
          name      : 'site',
          type      : 'objectInArray',
          parent    : 'd',
          parents   : ['d'],
          position  : {},
          iterators : [],
          xmlParts  : [
            { attr : 'id', formatters : [], obj : 'dsitei__0', pos : 30, posOrigin : 30 }
          ],
          conditions : [
            { left : { parent : 'dsitei__0', attr : 'i' }, operator : '==', right : '0' }
          ]
        }
      });
    });
    it('should manage arrays with conditions and accept direct access [0] [1]', function () {
      var _markers = [
        {pos : 20, name : 'd.site[ 1303 ].id'},
        {pos : 30, name : 'd.site[0].id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        // eslint-disable-next-line
        dsitei__1303 : {
          name      : 'site',
          type      : 'objectInArray',
          parent    : 'd',
          parents   : ['d'],
          position  : {},
          iterators : [],
          xmlParts  : [
            { attr : 'id', formatters : [], obj : 'dsitei__1303', pos : 20, posOrigin : 20 }
          ],
          conditions : [
            { left : { parent : 'dsitei__1303',  attr : 'i' }, operator : '==', right : '1303' }
          ]
        },
        // eslint-disable-next-line
        dsitei__0 : {
          name      : 'site',
          type      : 'objectInArray',
          parent    : 'd',
          parents   : ['d'],
          position  : {},
          iterators : [],
          xmlParts  : [
            { attr : 'id', formatters : [], obj : 'dsitei__0', pos : 30, posOrigin : 30 }
          ],
          conditions : [
            { left : { parent : 'dsitei__0', attr : 'i' }, operator : '==', right : '0' }
          ]
        }
      });
    });
    it('should detect multiple conditions separated by a comma', function () {
      var _markers = [
        {pos : 20, name : 'd.site[ i = 1, sort >  310].id'},
        {pos : 30, name : 'd.site[ i = 0,   bank < 54,  lang = en].id'}
      ];
      helper.assert(extracter.splitMarkers(_markers),  {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        // eslint-disable-next-line
        dsitesort__310i__1 : {
          name      : 'site',
          type      : 'objectInArray',
          parent    : 'd',
          parents   : ['d'],
          position  : {},
          iterators : [],
          xmlParts  : [{
            attr       : 'id',
            formatters : [],
            obj        : 'dsitesort__310i__1',
            pos        : 20,
            posOrigin  : 20
          }],
          conditions : [{
            left : {
              parent : 'dsitesort__310i__1',
              attr   : 'i'
            },
            operator : '==',
            right    : '1'
          }, {
            left : {
              parent : 'dsitesort__310i__1',
              attr   : 'sort'
            },
            operator : '>',
            right    : '310'
          }]
        },
        // eslint-disable-next-line
        dsitelang__enbank__54i__0 : {
          name      : 'site',
          type      : 'objectInArray',
          parent    : 'd',
          parents   : ['d'],
          position  : {},
          iterators : [],
          xmlParts  : [{
            attr       : 'id',
            formatters : [],
            obj        : 'dsitelang__enbank__54i__0',
            pos        : 30,
            posOrigin  : 30
          }],
          conditions : [{
            left : {
              parent : 'dsitelang__enbank__54i__0',
              attr   : 'i'
            },
            operator : '==',
            right    : '0'
          }, {
            left : {
              parent : 'dsitelang__enbank__54i__0',
              attr   : 'bank'
            },
            operator : '<',
            right    : '54'
          }, {
            left : {
              parent : 'dsitelang__enbank__54i__0',
              attr   : 'lang'
            },
            operator : '==',
            right    : 'en'
          }]
        }
      });
    });
    it('should accept iterators and condition in an array', function () {
      var _markers = [
        {pos : 20, name : 'd.site[sort > 10, i].id'},
        {pos : 30, name : 'd.site[sort > 10, i+1].id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        dsite : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 20, end : 30 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dsite', pos : 20, posOrigin : 20, conditions : [{left : {parent : 'dsite', attr : 'sort'}, operator : '>', right : '10'}]}
          ]
        }
      });
    });
    it('should accept than the condition appears after the iterator', function () {
      var _markers = [
        {pos : 20, name : 'd.site[i   , sort > 10].id'},
        {pos : 30, name : 'd.site[i+1 , sort > 10].id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        dsite : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 20, end : 30 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dsite', pos : 20, posOrigin : 20, conditions : [{left : {parent : 'dsite', attr : 'sort'}, operator : '>', right : '10'}]}
          ]
        }
      });
    });
    it('should manage conditions in nested array (should keep the parent name)', function () {
      var _markers = [
        {pos : 20, name : 'd[sort > 10, i].site[i].id'},
        {pos : 25, name : 'd[sort > 10, i].site[i+1].id'},
        {pos : 30, name : 'd[sort > 10, i+1].site[i].id'},
        {pos : 35, name : 'd[sort > 10, i+1].site[i+1].id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name      : 'd',
          type      : 'array',
          parent    : '',
          parents   : [],
          position  : { start : 20, end : 30 },
          iterators : [{ attr : 'i' }],
          xmlParts  : []
        },
        dsite : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 20, end : 25 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dsite', pos : 20, posOrigin : 20, conditions : [{left : {parent : 'd', attr : 'sort'}, operator : '>', right : '10'}]}
          ]
        }
      });
    });
    it('2. should manage conditions in nested array (complex array))', function () {
      var _markers = [
        {pos : 20, name : 'd[i][sort > 10, i].id'},
        {pos : 25, name : 'd[i][sort > 10, i+1].id'},
        {pos : 30, name : 'd[i+1][sort > 10, i].id'},
        {pos : 35, name : 'd[i+1][sort > 10, i+1].id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name      : 'd',
          type      : 'array',
          parent    : '',
          parents   : [],
          position  : { start : 20, end : 30 },
          iterators : [{ attr : 'i' }],
          xmlParts  : []
        },
        d_ : {
          name      : '',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 20, end : 25 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'd_', pos : 20, posOrigin : 20, conditions : [{left : {parent : 'd_', attr : 'sort'}, operator : '>', right : '10'}]}
          ]
        }
      });
    });
    it.skip('should accept conditions with a formatters', function () {
      var _markers = [
        {pos : 20, name : 'd.site[i   , sort:int > 10].id'},
        {pos : 30, name : 'd.site[i+1 , sort:int > 10].id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        dsite : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 20, end : 30 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr       : 'id', formatters : [], obj        : 'dsite', pos        : 20, posOrigin  : 20,
              conditions : [
                {
                  left     : {parent : 'dsite', attr : 'sort', formatters : ['int']},
                  operator : '>',
                  right    : '10'
                }
              ]
            }
          ]
        }
      });
    });
    it('should accept multiple occurrences of the same array', function () {
      var _markers = [
        {pos : 20, name : 'd.site[i].id'},
        {pos : 21, name : 'd.site[i].val'},
        {pos : 30, name : 'd.site[i+1].id'},
        {pos : 31, name : 'd.site[i+1].val'},
        {pos : 40, name : 'd.site[i].id'},
        {pos : 41, name : 'd.site[i].val'},
        {pos : 50, name : 'd.site[i+1].id'},
        {pos : 51, name : 'd.site[i+1].val'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        dsite : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 20, end : 30 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dsite', pos : 20, posOrigin : 20},
            {attr : 'val', formatters : [], obj : 'dsite', pos : 21, posOrigin : 21}
          ]
        },
        dsite$ : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 40, end : 50 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dsite$', pos : 40, posOrigin : 40},
            {attr : 'val', formatters : [], obj : 'dsite$', pos : 41, posOrigin : 41}
          ]
        }
      });
    });
    it('should accept at least three occurrences of the same array', function () {
      var _markers = [
        {pos : 20, name : 'd.site[i].id'},
        {pos : 30, name : 'd.site[i+1].id'},
        {pos : 40, name : 'd.site[i].id'},
        {pos : 50, name : 'd.site[i+1].id'},
        {pos : 60, name : 'd.site[i].id'},
        {pos : 70, name : 'd.site[i+1].id'},
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        dsite : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 20, end : 30 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dsite', pos : 20, posOrigin : 20}
          ]
        },
        dsite$ : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 40, end : 50 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dsite$', pos : 40, posOrigin : 40}
          ]
        },
        dsite$$ : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 60, end : 70 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dsite$$', pos : 60, posOrigin : 60}
          ]
        }
      });
    });
    it('should accept multiple occurrences of the same array with conditions', function () {
      var _markers = [
        {pos : 20, name : 'd.site[i, id >1].id'},
        {pos : 30, name : 'd.site[i+1, id >1].id'},
        {pos : 40, name : 'd.site[i, val >2].id'},
        {pos : 50, name : 'd.site[i+1, val >2].id'},
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        dsite : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 20, end : 30 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dsite', pos : 20, posOrigin : 20, conditions : [{left : {parent : 'dsite', attr : 'id'}, operator : '>', right : '1'}]},
          ]
        },
        dsite$ : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 40, end : 50 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dsite$', pos : 40, posOrigin : 40, conditions : [{left : {parent : 'dsite$', attr : 'val'}, operator : '>', right : '2'}]},
          ]
        }
      });
    });
    it('should accept multiple occurrences of the same array with conditions and nested objects', function () {
      var _markers = [
        {pos : 20, name : 'd.site[i, id >1].obj.id'},
        {pos : 30, name : 'd.site[i+1, id >1].obj.id'},
        {pos : 40, name : 'd.site[i, val >2].obj.id'},
        {pos : 50, name : 'd.site[i+1, val >2].obj.id'},
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        dsite : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 20, end : 30 },
          iterators : [{ attr : 'i' }],
          xmlParts  : []
        },
        dsiteobj : {
          name     : 'obj',
          type     : 'object',
          parent   : 'dsite',
          parents  : ['d', 'dsite'],
          xmlParts : [
            {attr : 'id', formatters : [], obj : 'dsiteobj', pos : 20, posOrigin : 20, conditions : [{left : {parent : 'dsite', attr : 'id'}, operator : '>', right : '1'}]},
          ]
        },
        dsite$ : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 40, end : 50 },
          iterators : [{ attr : 'i' }],
          xmlParts  : []
        },
        dsite$obj : {
          name     : 'obj',
          type     : 'object',
          parent   : 'dsite$',
          parents  : ['d', 'dsite$'],
          xmlParts : [
            {attr : 'id', formatters : [], obj : 'dsite$obj', pos : 40, posOrigin : 40, conditions : [{left : {parent : 'dsite$', attr : 'val'}, operator : '>', right : '2'}]},
          ]
        },
      });
    });
    it('should accept multiple occurrences of the same array with conditions', function () {
      var _markers = [
        {pos : 20, name : 'd.site[i, id >1].id'},
        {pos : 30, name : 'd.site[i+1, id >1].id'},
        {pos : 40, name : 'd.site[i, val >2].id'},
        {pos : 50, name : 'd.site[i+1, val >2].id'},
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        dsite : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 20, end : 30 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dsite', pos : 20, posOrigin : 20, conditions : [{left : {parent : 'dsite', attr : 'id'}, operator : '>', right : '1'}]},
          ]
        },
        dsite$ : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 40, end : 50 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dsite$', pos : 40, posOrigin : 40, conditions : [{left : {parent : 'dsite$', attr : 'val'}, operator : '>', right : '2'}]},
          ]
        }
      });
    });
    it('should accept multiple occurrences of the same array with nested object', function () {
      var _markers = [
        {pos : 20, name : 'd.site[i].id'},
        {pos : 21, name : 'd.site[i].val'},
        {pos : 30, name : 'd.site[i+1].id'},
        {pos : 31, name : 'd.site[i+1].val'},
        {pos : 40, name : 'd.site[i].id'},
        {pos : 41, name : 'd.site[i].val'},
        {pos : 50, name : 'd.site[i+1].id'},
        {pos : 51, name : 'd.site[i+1].val'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        dsite : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 20, end : 30 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dsite', pos : 20, posOrigin : 20},
            {attr : 'val', formatters : [], obj : 'dsite', pos : 21, posOrigin : 21}
          ]
        },
        dsite$ : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 40, end : 50 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dsite$', pos : 40, posOrigin : 40},
            {attr : 'val', formatters : [], obj : 'dsite$', pos : 41, posOrigin : 41}
          ]
        }
      });
    });
    it('should manage arrays even if there are some attributes aside', function () {
      var _markers = [
        {pos : 20, name : 'd.site[i].id'},
        {pos : 28, name : 'd.movie'},
        {pos : 30, name : 'd.site[i+1].id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : [
            {attr : 'movie', formatters : [], obj : 'd', pos : 28, posOrigin : 28}
          ]
        },
        dsite : {
          name      : 'site',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 20, end : 30 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dsite', pos : 20, posOrigin : 20}
          ]
        }
      });
    });
    it('should manage nested arrays', function () {
      var _markers = [
        {pos : 1 , name : 'd.menu[i].id'},
        {pos : 10, name : 'd.menu[i].cars'},
        {pos : 20, name : 'd.menu[i].menuElement[i].id'},
        {pos : 30, name : 'd.menu[i].menuElement[i+1].id'},
        {pos : 40, name : 'd.menu[i+1].id'},
        {pos : 50, name : 'd.menu[i+1].cars'},
        {pos : 60, name : 'd.menu[i+1].menuElement[i].id'},
        {pos : 70, name : 'd.menu[i+1].menuElement[i+1].id'},
        {pos : 80, name : 'd.site'},
        {pos : 90, name : 'd.product.id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : [
            {attr : 'site', formatters : [], obj : 'd', pos : 80, posOrigin : 80}
          ]
        },
        dmenu : {
          name      : 'menu',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : {start : 1, end : 40},
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dmenu', pos : 1, posOrigin : 1},
            {attr : 'cars', formatters : [], obj : 'dmenu', pos : 10, posOrigin : 10}
          ]
        },
        dmenumenuElement : {
          name      : 'menuElement',
          type      : 'array',
          parent    : 'dmenu',
          parents   : ['d', 'dmenu'],
          position  : {start : 20, end : 30},
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dmenumenuElement', pos : 20, posOrigin : 20}
          ]
        },
        dproduct : {
          name     : 'product',
          type     : 'object',
          parent   : 'd',
          parents  : ['d'],
          xmlParts : [
            {attr : 'id', formatters : [], obj : 'dproduct', pos : 90, posOrigin : 90}
          ]
        }
      });
    });
    it.skip('2 inverse order should decompose all markers', function () {
      var _markers = [
        {pos : 10, name : 'd.menu[i].menuElement[i].id'},
        {pos : 20, name : 'd.menu[i+1].menuElement[i].id'},
        {pos : 30, name : 'd.menu[i].menuElement[i+1].id'},
        {pos : 40, name : 'd.menu[i+1].menuElement[i+1].id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          /* 'depth' : 0,*/
          xmlParts : []
        },
        dmenu : {
          name      : 'menu',
          type      : 'array',
          parent    : 'd',
          parents   : [],
          position  : {start : 10, end : 20},
          iterators : [{ attr : 'i' }],
          xmlParts  : []
        },
        dmenumenuElement : {
          name      : 'menuElement',
          type      : 'array',
          parent    : 'dmenu',
          parents   : ['d', 'dmenu'],
          position  : {start : 10, end : 30},
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dmenumenuElement', pos : 10, posOrigin : 10}
          ]
        }
      });
    });
    it('should decompose all markers even if there are some objects within the array', function () {
      var _markers = [
        {pos : 1  , name : 'd.menu[i].id'},
        {pos : 10 , name : 'd.menu[i].cars'},
        {pos : 20 , name : 'd.site'},
        {pos : 30 , name : 'd.product.id'},
        {pos : 40 , name : 'd.menu[i].menuElement[i=0].id'},
        {pos : 50 , name : 'd.menu[i+1].id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : [
            {attr : 'site', formatters : [], obj : 'd', pos : 20, posOrigin : 20}
          ]
        },
        dmenu : {
          name      : 'menu',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : { start : 1, end : 50 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id'  , formatters : [], obj : 'dmenu', pos : 1, posOrigin : 1},
            {attr : 'cars', formatters : [], obj : 'dmenu', pos : 10, posOrigin : 10}
          ]
        },
        dproduct : {
          name     : 'product',
          type     : 'object',
          parent   : 'd',
          parents  : ['d'],
          xmlParts : [
            {attr : 'id', formatters : [], obj : 'dproduct', pos : 30, posOrigin : 30}
          ]
        },
        // eslint-disable-next-line
        dmenumenuElementi__0 : {
          name      : 'menuElement',
          type      : 'objectInArray',
          parent    : 'dmenu',
          parents   : ['d', 'dmenu'],
          position  : {},
          iterators : [],
          xmlParts  : [{
            attr       : 'id',
            formatters : [],
            obj        : 'dmenumenuElementi__0',
            pos        : 40,
            posOrigin  : 40
          }],
          conditions : [
            { left : { parent : 'dmenumenuElementi__0', attr : 'i' }, operator : '==', right : '0' }
          ]
        }
      });
    });
    it('should manage multidimensional arrays and multiple arrays', function () {
      var _markers = [
        {pos : 1 , name : 'd.menu[i][i].id'},
        {pos : 2 , name : 'd.menu[i][i+1].id'},
        {pos : 3 , name : 'd.menu[i+1][i].id'},
        {pos : 4 , name : 'd.menu[i+1][i+1].id'},
        {pos : 5 , name : 'd.product.id'},
        {pos : 6 , name : 'd.days[i].name'},
        {pos : 7 , name : 'd.days[i+1].name'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        dmenu : {
          name      : 'menu',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : {start : 1, end : 3 },
          iterators : [{ attr : 'i' }],
          xmlParts  : []
        },
        dmenu_ : {
          name      : '',
          type      : 'array',
          parent    : 'dmenu',
          parents   : ['d', 'dmenu'],
          position  : {start : 1, end : 2 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'id', formatters : [], obj : 'dmenu_', pos : 1, posOrigin : 1}
          ]
        },
        dproduct : {
          name     : 'product',
          type     : 'object',
          parent   : 'd',
          parents  : ['d'],
          xmlParts : [
            {attr : 'id', formatters : [], obj : 'dproduct', pos : 5, posOrigin : 5}
          ]
        },
        ddays : {
          name      : 'days',
          type      : 'array',
          parent    : 'd',
          parents   : ['d'],
          position  : {start : 6, end : 7 },
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {attr : 'name', formatters : [], obj : 'ddays', pos : 6, posOrigin : 6}
          ]
        }
      });
    });
    it.skip('should decompose even with very complex arrays', function () {
      var _markers = [
        {pos : 1 , name : 'd.menu[1][0][1].product[0].site.id'},
        {pos : 2 , name : 'd.product.id'},
        {pos : 3 , name : 'd.cars.product.id'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : '',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        menu1 : {
          name     : 'menu',
          type     : 'array',
          parent   : 'd',
          parents  : ['d'],
          xmlParts : []
        },
        menu2 : {
          name     : 'menu',
          type     : 'array',
          parent   : 'menu1',
          parents  : ['d', 'menu1'],
          xmlParts : []
        },
        menu3 : {
          name     : 'menu',
          type     : 'array',
          parent   : 'menu2',
          parents  : ['d', 'menu1', 'menu2'],
          xmlParts : []
        },
        product4 : {
          name     : 'product',
          type     : 'array',
          parent   : 'menu3',
          parents  : ['d', 'menu1', 'menu2', 'menu3'],
          xmlParts : []
        },
        site5 : {
          name     : 'site',
          type     : 'object',
          parent   : 'product4',
          parents  : ['d', 'menu1', 'menu2', 'menu3', 'product4'],
          xmlParts : [
            {attr : 'id', formatters : [], obj : 'site5', pos : 1, posOrigin : 1}
          ]
        },
        product6 : {
          name     : 'product',
          type     : 'object',
          parent   : 'd',
          parents  : ['d'],
          xmlParts : [
            {attr : 'id', formatters : [], obj : 'product6', pos : 2, posOrigin : 2}
          ]
        },
        cars7 : {
          name     : 'cars',
          type     : 'object',
          parent   : 'd',
          parents  : ['d'],
          xmlParts : []
        },
        product8 : {
          name     : 'product',
          type     : 'object',
          parent   : 'cars7',
          parents  : ['d', 'cars7'],
          xmlParts : [
            {attr : 'id', formatters : [], obj : 'product8', pos : 3, posOrigin : 3}
          ]
        }
      });
    });
    it('should extract basic formatters', function () {
      var _markers = [
        {pos : 20, name : 'd.number:int'},
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : [
            {attr : 'number', formatters : [ 'int' ], obj : 'd', pos : 20, posOrigin : 20},
          ]
        }
      });
    });
    it('should extract basic three formatters', function () {
      var _markers = [
        {pos : 20, name : 'd.number:int:float:decimal'},
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : [
            {attr : 'number', formatters : [ 'int' ,'float', 'decimal' ], obj : 'd', pos : 20, posOrigin : 20},
          ]
        }
      });
    });
    it('should ignore whitespaces in formatters', function () {
      var _markers = [
        {pos : 20, name : 'd.number : int  :   float   :  decimal'},
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : [
            {attr : 'number', formatters : [ 'int' ,'float', 'decimal' ], obj : 'd', pos : 20, posOrigin : 20},
          ]
        }
      });
    });
    it('should detect formatters with parenthesis', function () {
      var _markers = [
        {pos : 20, name : 'd.number:parse(YYYYMMDD)'},
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : [
            {attr : 'number', formatters : [ 'parse(YYYYMMDD)'], obj : 'd', pos : 20, posOrigin : 20},
          ]
        }
      });
    });
    it('should detect multiple formatters', function () {
      var _markers = [
        {pos : 10, name : 'd.site'},
        {pos : 20, name : 'd.number:int'},
        {pos : 30, name : 'd.date:parse(Y)'},
        {pos : 40, name : 'd.date:parse(YYYYMMDD):format(DD/MM/YYYY)'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : [
            {attr : 'site'  , formatters : []                                         , obj : 'd', pos : 10, posOrigin : 10},
            {attr : 'number', formatters : [ 'int' ]                                  , obj : 'd', pos : 20, posOrigin : 20},
            {attr : 'date'  , formatters : [ 'parse(Y)' ]                             , obj : 'd', pos : 30, posOrigin : 30},
            {attr : 'date'  , formatters : [ 'parse(YYYYMMDD)', 'format(DD/MM/YYYY)' ], obj : 'd', pos : 40, posOrigin : 40}
          ]
        }
      });
    });
    it('should detect formatters even if we use special character in the parenthesis', function () {
      var _markers = [
        {pos : 20, name : 'd.number:parse(YY, YY:MM:D.ZZ [Z]menu[i+1][i] d.bla, i=0)'},
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : [
            {attr : 'number', formatters : [ 'parse(YY,YY:MM:D.ZZ[Z]menu[i+1][i]d.bla,i=0)'], obj : 'd', pos : 20, posOrigin : 20},
          ]
        }
      });
    });
    it.skip('should detect formatter even in the iterator of an array', function () {
      var _markers = [
        {pos : 20, name : 'd[day:weekday].meteo'},
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'array',
          parent   : '',
          parents  : [],
          xmlParts : [
            {attr : 'meteo', formatters : [ 'weekday=1'], obj : 'd', pos : 20, posOrigin : 20},
          ]
        }
      });
    });
    it('should clean unwanted spaces', function () {
      var _markers = [
        {pos : 10, name : ' d.site'},
        {pos : 20, name : 'd. number:int '},
        {pos : 30, name : 'd . date:parse(Y)'},
        {pos : 40, name : 'd.date: parse(YYYYMMDD) :format(DD/MM/YYYY)'}
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : [
            {attr : 'site', formatters : [], obj : 'd', pos : 10, posOrigin : 10},
            {attr : 'number', formatters : [ 'int' ], obj : 'd', pos : 20, posOrigin : 20},
            {attr : 'date', formatters : [ 'parse(Y)' ], obj : 'd', pos : 30, posOrigin : 30},
            {attr : 'date', formatters : [ 'parse(YYYYMMDD)', 'format(DD/MM/YYYY)' ], obj : 'd', pos : 40, posOrigin : 40}
          ]
        }
      });
    });
    it('should detect formatters with simple quotes, and it should keep whitespaces', function () {
      var _markers = [
        {pos : 20, name : 'd.number:parse(\'YYYY MM DD\')'},
      ];
      helper.assert(extracter.splitMarkers(_markers), {
        d : {
          name     : 'd',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : [
            {attr : 'number', formatters : [ 'parse(\'YYYY MM DD\')'], obj : 'd', pos : 20, posOrigin : 20},
          ]
        }
      });
    });
    it('should not generate duplicated iterators if they are incremented in the same time', function () {
      var _markers = [
        {pos : 13, name : '_root.d[i].site.label'},
        {pos : 22, name : '_root.d[i].cars[i].name'},
        {pos : 23, name : '_root.d[i].cars[i].autonomy'},
        {pos : 32, name : '_root.d[i].cars[i].spec.weight'},
        {pos : 41, name : '_root.d[i].cars[i].wheels[i].strengh'},
        {pos : 42, name : '_root.d[i].cars[i].wheels[i].tire.brand'},
        {pos : 60, name : '_root.d[i+1].site.label'},
        {pos : 69, name : '_root.d[i+1].cars[i+1].name'},
        {pos : 70, name : '_root.d[i+1].cars[i+1].autonomy'},
        {pos : 79, name : '_root.d[i+1].cars[i+1].spec.weight'},
        {pos : 88, name : '_root.d[i+1].cars[i+1].wheels[i+1].strengh'},
        {pos : 89, name : '_root.d[i+1].cars[i+1].wheels[i+1].tire.brand'}
      ];
      helper.assert(extracter.splitMarkers(_markers),
        {
          _root : {
            name     : '_root',
            type     : 'object',
            parent   : '',
            parents  : [],
            xmlParts : []
          },
          _rootd : {
            name      : 'd',
            type      : 'array',
            parent    : '_root',
            parents   : [ '_root' ],
            position  : { start : 13, end : 60 },
            iterators : [ { attr : 'i' } ],
            xmlParts  : []
          },
          _rootdsite : {
            name     : 'site',
            type     : 'object',
            parent   : '_rootd',
            parents  : [ '_root', '_rootd' ],
            xmlParts : [ { attr : 'label', formatters : [], obj : '_rootdsite', pos : 13, posOrigin : 13 } ]
          },
          _rootdcars : {
            name      : 'cars',
            type      : 'array',
            parent    : '_rootd',
            parents   : [ '_root', '_rootd' ],
            position  : { start : 22, end : 69 },
            iterators : [ { attr : 'i' } ],
            xmlParts  : [
              { attr : 'name', formatters : [], obj : '_rootdcars', pos : 22, posOrigin : 22 },
              { attr : 'autonomy', formatters : [], obj : '_rootdcars', pos : 23, posOrigin : 23 }
            ]
          },
          _rootdcarsspec : {
            name     : 'spec',
            type     : 'object',
            parent   : '_rootdcars',
            parents  : [ '_root', '_rootd', '_rootdcars' ],
            xmlParts : [
              { attr : 'weight', formatters : [], obj : '_rootdcarsspec', pos : 32, posOrigin : 32 }
            ]
          },
          _rootdcarswheels : {
            name      : 'wheels',
            type      : 'array',
            parent    : '_rootdcars',
            parents   : [ '_root', '_rootd', '_rootdcars' ],
            position  : { start : 41, end : 88 },
            iterators : [ { attr : 'i' } ],
            xmlParts  : [
              { attr : 'strengh', formatters : [], obj : '_rootdcarswheels', pos : 41, posOrigin : 41 }
            ]
          },
          _rootdcarswheelstire : {
            name     : 'tire',
            type     : 'object',
            parent   : '_rootdcarswheels',
            parents  : [ '_root', '_rootd', '_rootdcars', '_rootdcarswheels' ],
            xmlParts : [
              { attr : 'brand', formatters : [], obj : '_rootdcarswheelstire', pos : 42, posOrigin : 42 }
            ]
          }
        }
      );
    });
  });

  describe('splitXml', function () {
    it('should extract return the staticData if there is no dynamic data', function () {
      var _xml = '<div></div>';
      var _descriptor = {
        d0 : {
          name     : '',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        staticData : {
          before : '<div></div>',
          after  : ''
        },
        dynamicData : {
          d0 : {
            name     : '',
            type     : 'object',
            parent   : '',
            parents  : [],
            xmlParts : [],
            /* 'depth' : 0*/
          }
        }
      });
    });
    it('should extract xml parts in the staticData object', function () {
      var _xml = '<div></div>';
      var _descriptor = {
        d0 : {
          name     : '',
          type     : 'object',
          parent   : '',
          parents  : [],
          /* 'depth': null,*/
          xmlParts : [
            {obj : 'd0', attr : 'menu', pos : 5}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        staticData : {
          before : '<div>',
          after  : '</div>'
        },
        dynamicData : {
          d0 : {
            name     : '',
            type     : 'object',
            parent   : '',
            parents  : [],
            xmlParts : [
              {obj : 'd0', attr : 'menu', pos : 5, depth : 0}
            ]
          }
        }
      });
    });
    it('2 should extract xml parts for each tag attribute', function () {
      var _xml = '<div><p><h1></h1></p></div>';
      var _descriptor = {
        d0 : {
          name     : '',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : [
            {obj : 'd0', attr : 'menu', pos : 5},
            {obj : 'd0', attr : 'val', pos : 8},
            {obj : 'd0', attr : 'test', pos : 12}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        staticData : {
          before : '<div>',
          after  : '</h1></p></div>'
        },
        dynamicData : {
          d0 : {
            name     : '',
            type     : 'object',
            parent   : '',
            parents  : [],
            xmlParts : [
              {obj : 'd0', attr : 'menu' , pos : 5 , depth : 0, after : '<p>'},
              {obj : 'd0', attr : 'val'  , pos : 8 , depth : 0, after : '<h1>'},
              {obj : 'd0', attr : 'test' , pos : 12, depth : 0}
            ]
          }
        }
      });
    });
    it('XML parts of conditional blocks should be detected\
      It should also detect the condition with "showBegin" and "showEnd" formatters', function () {
      var _xml = '<div><x><tr></tr><tr></tr></x><p><h1></h1>p</p><th></th><th></th></div>';
      var _descriptor = {
        d0 : {
          name     : '',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        element1 : {
          name      : 'element',
          type      : 'array',
          parent    : 'd0',
          parents   : ['d0'],
          position  : {start : 12, end : 21}, /* Approximative position */
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : 'element1', attr : 'id', pos : 12, posOrigin : 12}
          ]
        },
        info1 : {
          name     : 'info',
          type     : 'object',
          parent   : 'd0',
          parents  : ['d0'],
          xmlParts : [
            {obj : 'info1', formatters : ['ifEq(3)', 'showBegin()'], attr : 'test', pos : 30, posOrigin : 30}, // if start
            {obj : 'info1', formatters : []                        , attr : 'val' , pos : 33, posOrigin : 30},
            {obj : 'info1', formatters : ['ifEq(3)', 'showEnd()']  , attr : 'test', pos : 42, posOrigin : 42} // if end
          ]
        },
        menus2 : {
          name      : 'menus',
          type      : 'array',
          parent    : 'd0',
          parents   : ['d0'],
          position  : {start : 51, end : 60}, /* Approximative position */
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : 'menus2', attr : 'id', pos : 51, posOrigin : 51}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        staticData : {
          before : '<div><x>',
          after  : '</div>'
        },
        dynamicData : {
          d0 : {
            name     : '',
            type     : 'object',
            parent   : '',
            parents  : [],
            xmlParts : []
          },
          element1 : {
            name      : 'element',
            type      : 'array',
            parent    : 'd0',
            parents   : ['d0'],
            position  : {start : 8, end : 17, endOdd : 26},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'element1', attr : 'id'    , pos : 12, posOrigin : 12, depth : 1},
              {obj : 'element1', array : 'start', pos : 8 , posOrigin : 12 , depth : 1, after : '<tr>'},
              {obj : 'element1', array : 'end'  , pos : 17, posOrigin : 21, depth : 1, before : '</tr>'}
            ],
            depth : 1
          },
          info1 : {
            name     : 'info',
            type     : 'object',
            parent   : 'd0',
            parents  : ['d0'],
            xmlParts : [
              {obj : 'info1', formatters : ['ifEq(3)', 'showBegin()'], attr : 'test', pos : 33       , posOrigin : 30 , depth : 0 , before : '</x><p>', after : ''}, // if start
              {obj : 'info1', formatters : []                        , attr : 'val' , pos : 33.015625, posOrigin : 30 , depth : 0 , after : '<h1></h1>'},
              {obj : 'info1', formatters : ['ifEq(3)', 'showEnd()']  , attr : 'test', pos : 42       , posOrigin : 42 , depth : 0 , after : 'p</p>'  } // if end
            ]
          },
          menus2 : {
            name      : 'menus',
            type      : 'array',
            parent    : 'd0',
            parents   : ['d0'],
            position  : {start : 47, end : 56, endOdd : 65},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'menus2', attr : 'id'    , pos : 51, posOrigin : 51, depth : 1},
              {obj : 'menus2', array : 'start', pos : 47, posOrigin : 51,  depth : 1, after : '<th>'},
              {obj : 'menus2', array : 'end'  , pos : 56, posOrigin : 60, depth : 1, before : '</th>'}
            ],
            depth : 1
          },
        }
      });
    });
    it('should generate new if-block (and keep array conditions) to remove everything without breaking XML', function () {
      var _xml = '<div><p></p><if>aa</if><if>bb</if><br/></div>';
      var _condition = [{left : {parent : 'd0', attr : 'menu'}, operator : '>', right : '10'}];
      var _descriptor = {
        d0 : {
          name      : '',
          type      : 'array',
          parent    : '',
          parents   : [],
          position  : {start : 16, end : 39},
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : 'd0', formatters : ['ifEq(3)', 'showBegin()'], attr : 'menu', pos : 17, posOrigin : 17, conditions : _condition},
            {obj : 'd0', attr : 'menu', pos : 18, posOrigin : 18, conditions : _condition},
            {obj : 'd0', formatters : ['ifEq(3)', 'showEnd()']  , attr : 'menu', pos : 28, posOrigin : 28, conditions : _condition}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        staticData : {
          before : '<div><p></p>',
          after  : '</div>'
        },
        dynamicData : {
          d0 : {
            name      : '',
            type      : 'array',
            parent    : '',
            parents   : [],
            position  : {start : 12, end : 34, endOdd : 39 },
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'd0', formatters : ['ifEq(3)', 'showBegin()'], attr : 'menu', pos : 17,        posOrigin : 17, conditions : _condition, depth : 1, after : 'a'},
              {obj : 'd0'                                         , attr : 'menu', pos : 18,        posOrigin : 18, conditions : _condition, depth : 1, after : '' },
              {obj : 'd0', formatters : ['ifEq(3)', 'showEnd()']  , attr : 'menu', pos : 18.015625, posOrigin : 28, conditions : _condition, depth : 1, after : '</if><if>'},
              {obj : 'd0', formatters : ['ifEq(3)', 'showBegin()'], attr : 'menu', pos : 27,        posOrigin : 17, conditions : _condition, depth : 1, after : 'b'},
              {obj : 'd0', formatters : ['ifEq(3)', 'showEnd()']  , attr : 'menu', pos : 28,        posOrigin : 28, conditions : _condition, depth : 1},
              {obj : 'd0', array : 'start'                                       , pos : 12,        posOrigin : 16, depth : 1,  after : '<if>a'},
              {obj : 'd0', array : 'end'                                         , pos : 34,        posOrigin : 39, depth : 1, before : 'b</if>'},
            ],
            depth : 1
          }
        }
      });
    });

    it('should detect conditional blocks with hideBegin and hideEnd', function () {
      var _xml = '<div><p><h1></h1>p</p></div>';
      var _descriptor = {
        d0 : {
          name     : '',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : [
            {obj : 'd0', formatters : ['hideBegin'], attr : 'test', pos : 5 , posOrigin : 5}, // if start
            {obj : 'd0', formatters : []           , attr : 'val' , pos : 8 , posOrigin : 8},
            {obj : 'd0', formatters : ['hideEnd']  , attr : 'test', pos : 17, posOrigin : 17} // if end
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        staticData : {
          before : '<div><p>',
          after  : 'p</p></div>'
        },
        dynamicData : {
          d0 : {
            name     : '',
            type     : 'object',
            parent   : '',
            parents  : [],
            xmlParts : [
              {obj : 'd0' , formatters : ['hideBegin'], attr : 'test' , pos : 8        , posOrigin : 5 , depth : 0 , after : ''},
              {obj : 'd0' , formatters : []           , attr : 'val'  , pos : 8.015625 , posOrigin : 8 , depth : 0 , after : '<h1></h1>'},
              {obj : 'd0' , formatters : ['hideEnd']  , attr : 'test' , pos : 17       , posOrigin : 17, depth : 0 }
            ]
          }
        }
      });
    });

    it('should not return bad data if the start position (12) of the array equals the position of one attribute (menu)', function () {
      var _xml = '<div><p></p><br/></div>';
      var _descriptor = {
        d0 : {
          name      : '',
          type      : 'array',
          parent    : '',
          parents   : [],
          position  : {start : 12, end : 17}, /* Approximative position */
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : 'd0', attr : 'menu', pos : 12, posOrigin : 12},
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        staticData : {
          before : '<div><p></p>',
          after  : '</div>'
        },
        dynamicData : {
          d0 : {
            name      : '',
            type      : 'array',
            parent    : '',
            parents   : [],
            position  : {start : 12, end : 17, endOdd : 17 }, /* exact position */
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'd0', attr : 'menu'   , pos : 12.015625, posOrigin : 12, depth : 1},
              {obj : 'd0', array : 'start' , pos : 12       , posOrigin : 12, depth : 1,  after : ''},
              {obj : 'd0', array : 'end'   , pos : 17       , posOrigin : 17, depth : 1, before : '<br/>'}
            ],
            depth : 1
          }
        }
      });
    });

    it('3 should extract xml parts of an array', function () {
      var _xml = '<div><tr> <h1> </h1> </tr><tr> <h1> </h1> </tr></div>';
      var _descriptor = {
        d0 : {
          name      : '',
          type      : 'array',
          parent    : '',
          parents   : [],
          position  : {start : 9, end : 30}, /* Approximative position */
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : 'd0', attr : 'menu', pos : 9 , posOrigin : 9},
            {obj : 'd0', attr : 'val' , pos : 14, posOrigin : 14},
            {obj : 'd0', attr : 'test', pos : 20, posOrigin : 20}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        staticData : {
          before : '<div>',
          after  : '</div>'
        },
        dynamicData : {
          d0 : {
            name      : '',
            type      : 'array',
            parent    : '',
            parents   : [],
            position  : {start : 5, end : 26, endOdd : 47}, /* exact position */
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'd0', attr : 'menu'   , pos : 9 , posOrigin : 9 ,  depth : 1,  after : ' <h1>'},
              {obj : 'd0', attr : 'val'    , pos : 14, posOrigin : 14, depth : 1,  after : ' </h1>'},
              {obj : 'd0', attr : 'test'   , pos : 20, posOrigin : 20, depth : 1},
              {obj : 'd0', array : 'start' , pos : 5 , posOrigin : 9 , depth : 1,  after : '<tr>'},
              {obj : 'd0', array : 'end'   , pos : 26, posOrigin : 30, depth : 1, before : ' </tr>'}
            ],
            depth : 1
          }
        }
      });
    });

    it('3 should extract xml parts even if there are some dynamic data just after the array', function () {
      var _xml = '<div><tr> <h1> </h1> </tr><tr> <h1> </h1> </tr><p></p></div>';
      var _descriptor = {
        d0 : {
          name     : '',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : [
            {obj : 'd0', attr : 'info', pos : 50, posOrigin : 50}
          ]
        },
        menu1 : {
          name      : 'menu',
          type      : 'array',
          parent    : 'd0',
          parents   : ['d0'],
          position  : {start : 9, end : 30}, /* Approximative position */
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : 'menu1', attr : 'menu', pos : 9, posOrigin : 9},
            {obj : 'menu1', attr : 'val' , pos : 14, posOrigin : 14},
            {obj : 'menu1', attr : 'test', pos : 20, posOrigin : 20}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        staticData : {
          before : '<div>',
          after  : '</p></div>'
        },
        dynamicData : {
          d0 : {
            name     : '',
            type     : 'object',
            parent   : '',
            parents  : [],
            xmlParts : [
              {obj : 'd0', attr : 'info', pos : 50, posOrigin : 50, depth : 0, before : '<p>'}
            ]
          },
          menu1 : {
            name      : 'menu',
            type      : 'array',
            parent    : 'd0',
            parents   : ['d0'],
            position  : {start : 5, end : 26, endOdd : 47}, /* exact position */
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'menu1', attr : 'menu'   , pos : 9 , posOrigin : 9 ,  depth : 1,  after : ' <h1>'},
              {obj : 'menu1', attr : 'val'    , pos : 14, posOrigin : 14, depth : 1,  after : ' </h1>'},
              {obj : 'menu1', attr : 'test'   , pos : 20, posOrigin : 20, depth : 1},
              {obj : 'menu1', array : 'start' , pos : 5 , posOrigin : 9 , depth : 1,  after : '<tr>'},
              {obj : 'menu1', array : 'end'   , pos : 26, posOrigin : 30, depth : 1, before : ' </tr>'}
            ],
            depth : 1
          }
        }
      });
    });

    it('4 should extract xml parts even if there is a nested object in an array', function () {
      var _xml = '<div><tr> <h1> </h1> <p></p> </tr><tr> <h1> </h1> <p></p> </tr></div>';
      var _descriptor = {
        d0 : {
          name      : '',
          type      : 'array',
          parent    : '',
          parents   : [],
          position  : {start : 9, end : 38}, /* Approximative position */
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : 'd0', attr : 'menu', pos : 9 , posOrigin : 9},
            {obj : 'd0', attr : 'val' , pos : 14, posOrigin : 14},
            {obj : 'd0', attr : 'test', pos : 20, posOrigin : 20}
          ]
        },
        info1 : {
          name     : 'info',
          type     : 'object',
          parent   : 'd0',
          parents  : ['d0'],
          xmlParts : [
            {obj : 'info1', attr : 'id', pos : 24, posOrigin : 24}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        staticData : {
          before : '<div>',
          after  : '</div>'
        },
        dynamicData : {
          d0 : {
            name      : '',
            type      : 'array',
            parent    : '',
            parents   : [],
            position  : {start : 5, end : 34, endOdd : 63}, /* exact position */
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'd0', attr : 'menu'  , pos : 9 , posOrigin : 9 ,  depth : 1,  after : ' <h1>'},
              {obj : 'd0', attr : 'val'   , pos : 14, posOrigin : 14, depth : 1,  after : ' </h1>'},
              {obj : 'd0', attr : 'test'  , pos : 20, posOrigin : 20, depth : 1,  after : ' <p>'},
              {obj : 'd0', array : 'start', pos : 5 , posOrigin : 9 ,  depth : 1, after : '<tr>'},
              {obj : 'd0', array : 'end'  , pos : 34, posOrigin : 38, depth : 1, before : '</p> </tr>'}
            ],
            depth : 1
          },
          info1 : {
            name     : 'info',
            type     : 'object',
            parent   : 'd0',
            parents  : ['d0'],
            xmlParts : [
              {obj : 'info1', attr : 'id', pos : 24, posOrigin : 24, depth : 1}
            ]
          }
        }
      });
    });

    it('4 should extract xml parts even if there are two adjacents arrays', function () {
      var _xml = '<div><tr1> </tr1><tr1> </tr1> <tr2> </tr2><tr2> </tr2></div>';
      var _descriptor = {
        d0 : {
          name     : '',
          parent   : '',
          parents  : [],
          type     : 'object',
          xmlParts : []
        },
        movies1 : {
          name      : 'movies',
          parent    : 'd0',
          parents   : ['d0'],
          type      : 'array',
          depth     : 1,
          position  : {start : 10, end : 22}, /* Approximative position */
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : 'movies1', attr : 'title', pos : 11, posOrigin : 11, depth : 1 }
          ]
        },
        cars2 : {
          name      : 'cars',
          parent    : 'd0',
          parents   : ['d0'],
          type      : 'array',
          depth     : 1,
          position  : {start : 35, end : 48},
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : 'cars2', attr : 'brand', pos : 36, posOrigin : 36, depth : 1 }
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        staticData : {
          before : '<div>',
          after  : '</div>'
        },
        dynamicData : {
          d0 : {
            name     : '',
            parent   : '',
            parents  : [],
            type     : 'object',
            xmlParts : []
          },
          movies1 : {
            name      : 'movies',
            parent    : 'd0',
            parents   : ['d0'],
            type      : 'array',
            depth     : 1,
            position  : {start : 5, end : 17, endOdd : 29},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'movies1',  attr : 'title', pos : 11, posOrigin : 11, depth : 1 },
              {obj : 'movies1', array : 'start', pos : 5 , posOrigin : 10, depth : 1,after : '<tr1> ' },
              {obj : 'movies1', array : 'end'  , pos : 17, posOrigin : 22, depth : 1,before : '</tr1>' }
            ]
          },
          cars2 : {
            name      : 'cars',
            parent    : 'd0',
            parents   : ['d0'],
            type      : 'array',
            depth     : 1,
            position  : {start : 30, end : 42, endOdd : 54},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'cars2',  attr : 'brand', pos : 36, posOrigin : 36, depth : 1 },
              {obj : 'cars2', array : 'start', pos : 30, posOrigin : 35, depth : 1,after : '<tr2> ' },
              {obj : 'cars2', array : 'end'  , pos : 42, posOrigin : 48, depth : 1,before : '</tr2>' }
            ],
            before : ' '
          }
        }
      });
    });

    it('4 should extract xml parts even if there is some xml between two adjacents arrays. It should add a "before" attribute on the last array part', function () {
      var _xml = '<div><tr1> </tr1><tr1> </tr1> <b> <tr2> </tr2><tr2> </tr2></div>';
      var _descriptor = {
        d0 : {
          name     : '',
          parent   : '',
          parents  : [],
          type     : 'object',
          xmlParts : []
        },
        movies1 : {
          name      : 'movies',
          parent    : 'd0',
          parents   : ['d0'],
          type      : 'array',
          depth     : 1,
          position  : {start : 10, end : 22}, /* Approximative position */
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : 'movies1', attr : 'title', pos : 11, posOrigin : 11, depth : 1 }
          ]
        },
        cars2 : {
          name      : 'cars',
          parent    : 'd0',
          parents   : ['d0'],
          type      : 'array',
          depth     : 1,
          position  : {start : 39, end : 52},
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : 'cars2', attr : 'brand', pos : 40, posOrigin : 40, depth : 1 }
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        staticData : {
          before : '<div>',
          after  : '</div>'
        },
        dynamicData : {
          d0 : {
            name     : '',
            parent   : '',
            parents  : [],
            type     : 'object',
            xmlParts : []
          },
          movies1 : {
            name      : 'movies',
            parent    : 'd0',
            parents   : ['d0'],
            type      : 'array',
            depth     : 1,
            position  : {start : 5, end : 17, endOdd : 29},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'movies1',  attr : 'title', pos : 11, posOrigin : 11, depth : 1 },
              {obj : 'movies1', array : 'start', pos : 5 , posOrigin : 10, depth : 1,after : '<tr1> ' },
              {obj : 'movies1', array : 'end'  , pos : 17, posOrigin : 22, depth : 1,before : '</tr1>' }
            ]
          },
          cars2 : {
            name      : 'cars',
            parent    : 'd0',
            parents   : ['d0'],
            type      : 'array',
            depth     : 1,
            position  : {start : 34, end : 46, endOdd : 58},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'cars2',  attr : 'brand', pos : 40, posOrigin : 40, depth : 1 },
              {obj : 'cars2', array : 'start', pos : 34, posOrigin : 39, depth : 1,after : '<tr2> ' },
              {obj : 'cars2', array : 'end'  , pos : 46, posOrigin : 52, depth : 1,before : '</tr2>' }
            ],
            before : ' <b> '
          }
        }
      });
    });

    it('5 should extract xml parts even if there are two nested arrays and an object', function () {
      var _xml = '<div><tr A> <h1><tr B> <p></p> </tr><tr B> <p></p> </tr></h1> </tr> <tr A> <h1><tr B> <p></p> </tr><tr B> <p></p> </tr></h1> </tr></div>';
      var _descriptor = {
        d0 : {
          name      : '',
          type      : 'array',
          parent    : '',
          parents   : [],
          position  : {start : 11, end : 75}, /* Approximative position */
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : 'd0', attr : 'menu', pos : 11, posOrigin : 11},
          ]
        },
        element1 : {
          name      : 'element',
          type      : 'array',
          parent    : 'd0',
          parents   : ['d0'],
          position  : {start : 26, end : 46}, /* Approximative position */
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : 'element1', attr : 'id', pos : 26, posOrigin : 26}
          ]
        },
        info1 : {
          name     : 'info',
          type     : 'object',
          parent   : 'd0',
          parents  : ['d0'],
          xmlParts : [
            {obj : 'info1', attr : 'id', pos : 56, posOrigin : 56}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        staticData : {
          before : '<div>',
          after  : '</div>'
        },
        dynamicData : {
          d0 : {
            name      : '',
            type      : 'array',
            parent    : '',
            parents   : [],
            position  : {start : 5, end : 68, endOdd : 130}, /* exact position */
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'd0', attr : 'menu'   , pos : 11, posOrigin : 11, depth : 1, after : ' <h1>'},
              {obj : 'd0', array : 'start' , pos : 5 , posOrigin : 11,  depth : 1, after : '<tr A>'},
              {obj : 'd0', array : 'end'   , pos : 68, posOrigin : 75, depth : 1, before : '</h1> </tr> '},
            ],
            depth : 1
          },
          element1 : {
            name      : 'element',
            type      : 'array',
            parent    : 'd0',
            parents   : ['d0'],
            position  : {start : 16, end : 36, endOdd : 56}, /* exact position */
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'element1', attr : 'id'    , pos : 26, posOrigin : 26, depth : 2},
              {obj : 'element1', array : 'start', pos : 16, posOrigin : 26, depth : 2, after : '<tr B> <p>'},
              {obj : 'element1', array : 'end'  , pos : 36, posOrigin : 46, depth : 2, before : '</p> </tr>'}
            ],
            depth : 2
          },
          info1 : {
            name     : 'info',
            type     : 'object',
            parent   : 'd0',
            parents  : ['d0'],
            xmlParts : [
              {obj : 'info1', attr : 'id', pos : 56, posOrigin : 56, depth : 1}
            ]
          }
        }
      });
    });

    it('6 should extract xml parts even if there are two nested arrays', function () {
      var _xml = '<div><tr A> <h1><tr B> <p></p> </tr><tr B> <p></p> </tr></h1> </tr> <tr A> <h1><tr B> <p></p> </tr><tr B> <p></p> </tr></h1> </tr></div>';
      var _descriptor = {
        d0 : {
          name      : '',
          type      : 'array',
          parent    : '',
          parents   : [],
          position  : {start : 11, end : 75}, /* Approximative position */
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : 'd0', attr : 'menu', pos : 11, posOrigin : 11},
            {obj : 'd0', attr : 'val', pos : 56, posOrigin : 56}
          ]
        },
        element1 : {
          name      : 'element',
          type      : 'array',
          parent    : 'd0',
          parents   : ['d0'],
          position  : {start : 26, end : 46}, /* Approximative position */
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : 'element1', attr : 'id', pos : 26, posOrigin : 26}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        staticData : {
          before : '<div>',
          after  : '</div>'
        },
        dynamicData : {
          d0 : {
            name      : '',
            type      : 'array',
            parent    : '',
            parents   : [],
            position  : {start : 5, end : 68, endOdd : 130}, /* exact position */
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'd0', attr : 'menu'  , pos : 11, posOrigin : 11, depth : 1, after : ' <h1>' },
              {obj : 'd0', attr : 'val'   , pos : 56, posOrigin : 56, depth : 1, },
              {obj : 'd0', array : 'start', pos : 5 , posOrigin : 11,  depth : 1,  after : '<tr A>'},
              {obj : 'd0', array : 'end'  , pos : 68, posOrigin : 75, depth : 1,  before : '</h1> </tr> '}
            ],
            depth : 1
          },
          element1 : {
            name      : 'element',
            type      : 'array',
            parent    : 'd0',
            parents   : ['d0'],
            position  : {start : 16, end : 36, endOdd : 56}, /* exact position */
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'element1', attr : 'id'    , pos : 26, posOrigin : 26, depth : 2},
              {obj : 'element1', array : 'start', pos : 16, posOrigin : 26, depth : 2, after : '<tr B> <p>'},
              {obj : 'element1', array : 'end'  , pos : 36, posOrigin : 46, depth : 2, before : '</p> </tr>'}
            ],
            depth : 2
          }
        }
      });
    });

    it.skip('7 should extract xml parts even if the two nested arrays are in inverse order', function () {
      var _xml = '<div><tr A> <h1><tr B> <p></p> </tr><tr B> <p></p> </tr></h1> </tr> <tr A> <h1><tr B> <p></p> </tr><tr B> <p></p> </tr></h1> </tr></div>';
      var _descriptor = {
        d0 : {
          name      : '',
          type      : 'array',
          parent    : '',
          parents   : [],
          position  : {start : 26, end : 46}, /* Approximative position */
          iterators : [{ attr : 'i' }],
          xmlParts  : []
        },
        element1 : {
          name      : 'element',
          type      : 'array',
          parent    : 'd0',
          parents   : ['d0'],
          position  : {start : 11, end : 75}, /* Approximative position */
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : 'element1', attr : 'id', pos : 26, posOrigin : 26}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        staticData : {
          before : '<div>',
          after  : '</div>'
        },
        dynamicData : {
          d0 : {
            name      : '',
            type      : 'array',
            parent    : '',
            parents   : [],
            position  : {start : 16 , end : 36, endOdd : 56 }, /* Exact position */
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'd0', array : 'start', pos : 16, posOrigin : 16, depth : 2, moveTo : 'element1', after : '<tr B> <p>' },
              {obj : 'd0', array : 'end'  , pos : 36, posOrigin : 36, depth : 2, before : '</p> </tr>', moveTo : 'element1'},
            ],
            depth : 2
          },
          element1 : {
            name      : 'element',
            type      : 'array',
            parent    : 'd0',
            parents   : ['d0'],
            position  : {start : 5, end : 68, endOdd : 130}, /* Exact position */
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : 'element1', attr : 'id'    , pos : 26, posOrigin : 26, depth : 2},
              {obj : 'element1', array : 'start', pos : 5 , posOrigin : 11,  depth : 1, after : '<tr A> <h1>'},
              {obj : 'element1', array : 'end'  , pos : 68, posOrigin : 75, depth : 1, before : '</h1> </tr> '}
            ],
            depth : 1
          }
        }
      });
    });

    it('should add two attribute "moveTo" and "toDelete" to each xml part which are not in the right place (in the odd zone of the array, or inside an array)', function () {
      var _xml = '<xml><t_row>  </t_row><t_row>   </t_row></xml>';
      var _descriptor = {
        _root : {
          name     : '_root',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        _rootd : {
          name     : 'd',
          type     : 'object',
          parent   : '_root',
          parents  : ['_root'],
          xmlParts : [
            {obj : '_rootd', attr : 'root', pos : 12, posOrigin : 12},
            {obj : '_rootd', attr : 'root', pos : 30, posOrigin : 30}
          ]
        },
        _rootdcars : {
          name      : 'cars',
          type      : 'array',
          parent    : '_rootd',
          parents   : ['_root', '_rootd'],
          position  : {start : 12,end : 29},
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : '_rootdcars', attr : 'brand', pos : 13, posOrigin : 13}
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        staticData : {
          before : '<xml>',
          after  : '</xml>'
        },
        dynamicData : {
          _root : {
            name     : '_root',
            type     : 'object',
            parent   : '',
            parents  : [],
            xmlParts : []
          },
          _rootd : {
            name     : 'd',
            type     : 'object',
            parent   : '_root',
            parents  : ['_root'],
            xmlParts : [
              {obj : '_rootd', attr : 'root', pos : 12, posOrigin : 12, depth : 1, moveTo : '_rootdcars', after : ' '  },
              {obj : '_rootd', attr : 'root', pos : 30, posOrigin : 30, depth : 0, toDelete : true, before : ''        }
            ]
          },
          _rootdcars : {
            name      : 'cars',
            type      : 'array',
            parent    : '_rootd',
            parents   : ['_root', '_rootd'],
            position  : {start : 5,end : 22, endOdd : 40},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : '_rootdcars', attr : 'brand' , pos : 13, posOrigin : 13, depth : 1                                 },
              {obj : '_rootdcars', array : 'start', pos : 5 , posOrigin : 12, depth : 1, after : '<t_row>'             },
              {obj : '_rootdcars', array : 'end'  , pos : 22, posOrigin : 29, depth : 1, before : ' </t_row>'          }
            ],
            depth : 1
          }
        }
      });
    });
    it('should add two attribute "moveTo" and "toDelete" to each xml part which are not in the right place (in the odd zone of the array, or inside a nested array).\
        Complex case with two nested arrays. Attributes of the object should be pushed in the nested array', function () {
      var _xml = '<xml><t_row>     </t_row><t_row>   </t_row></xml>';
      var _descriptor = {
        _root : {
          name     : '_root',
          type     : 'object',
          parent   : '',
          parents  : [],
          xmlParts : []
        },
        _rootd : {
          name     : 'd',
          type     : 'object',
          parent   : '_root',
          parents  : ['_root'],
          xmlParts : [
            {obj : '_rootd', attr : 'root', pos : 15, posOrigin : 15},
            {obj : '_rootd', attr : 'root', pos : 34, posOrigin : 34},
          ]
        },
        _rootdcars : {
          name      : 'cars',
          type      : 'array',
          parent    : '_rootd',
          parents   : ['_root', '_rootd'],
          position  : {start : 12,end : 32},
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : '_rootdcars', attr : 'brand', pos : 13, posOrigin : 13},
            {obj : '_rootdcars', attr : 'brand', pos : 32, posOrigin : 32},
          ]
        },
        _rootdcarswheels : {
          name      : 'wheels',
          type      : 'array',
          parent    : '_rootdcars',
          parents   : ['_root', '_rootd', '_rootdcars'],
          position  : {start : 12,end : 32},
          iterators : [{ attr : 'i' }],
          xmlParts  : [
            {obj : '_rootdcarswheels', attr : 'size', pos : 14, posOrigin : 14},
            {obj : '_rootdcarswheels', attr : 'size', pos : 33, posOrigin : 33},
          ]
        }
      };
      helper.assert(extracter.splitXml(_xml, _descriptor), {
        staticData : {
          before : '<xml>',
          after  : '</xml>'
        },
        dynamicData : {
          _root : {
            name     : '_root',
            type     : 'object',
            parent   : '',
            parents  : [],
            xmlParts : []
          },
          _rootd : {
            name     : 'd',
            type     : 'object',
            parent   : '_root',
            parents  : ['_root'],
            xmlParts : [
              {obj : '_rootd', attr : 'root', pos : 15, posOrigin : 15, depth : 2, moveTo : '_rootdcarswheels' },
              {obj : '_rootd', attr : 'root', pos : 34, posOrigin : 34, depth : 0, toDelete : true        },
            ]
          },
          _rootdcars : {
            name      : 'cars',
            type      : 'array',
            parent    : '_rootd',
            parents   : ['_root', '_rootd'],
            position  : {start : 5,end : 25.015625, endOdd : 43},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : '_rootdcars', attr : 'brand' , pos : 13, posOrigin : 13, depth : 2, moveTo : '_rootdcarswheels' , after : ' '   },
              {obj : '_rootdcars', attr : 'brand' , pos : 32, posOrigin : 32, depth : 0, toDelete : true, before : '' }, // we do not care of depth because this part is in the odd section
              {obj : '_rootdcars', array : 'start', pos : 5 , posOrigin : 12, depth : 1, after : ''           },
              {obj : '_rootdcars', array : 'end'  , pos : 25.015625, posOrigin : 32, depth : 1, before : ''          }
            ],
            depth : 1
          },
          _rootdcarswheels : {
            name      : 'wheels',
            type      : 'array',
            parent    : '_rootdcars',
            parents   : ['_root', '_rootd', '_rootdcars'],
            position  : {start : 5.015625, end : 25, endOdd : 43},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : '_rootdcarswheels', attr : 'size'  , pos : 14       , posOrigin : 14, depth : 2, after : ' '},
              {obj : '_rootdcarswheels', attr : 'size'  , pos : 33       , posOrigin : 33, depth : 0, toDelete : true },
              {obj : '_rootdcarswheels', array : 'start', pos : 5.015625 , posOrigin : 12, depth : 2, after : '<t_row> ' },
              {obj : '_rootdcarswheels', array : 'end'  , pos : 25       , posOrigin : 32, depth : 2, before : '  </t_row>' }
            ],
            depth : 2
          }
        }
      });
    });
  });


  describe('buildSortedHierarchy', function () {
    it('should not use the depth attribute to resolve dependency', function () {
      var _data = {
        staticData  : {},
        dynamicData : {
          d     : {name : ''       , type : 'object' , parent : ''        , xmlParts : [], depth : 5 },
          menu1 : {name : 'menu'   , type : 'array'  , parent : 'd'      , xmlParts : [], depth : 1}
        }
      };
      helper.assert(extracter.buildSortedHierarchy(_data), {
        staticData  : {},
        dynamicData : _data.dynamicData,
        hierarchy   : ['d', 'menu1']
      });
    });
    it('should not generate an array with undefined values if the "d" is an array (depth>0)', function () {
      var _data = {
        staticData  : {},
        dynamicData : {
          d : {name : 'd' , type : 'array' , parent : ''  , xmlParts : [], depth : 1},
        }
      };
      helper.assert(extracter.buildSortedHierarchy(_data), {
        staticData  : {},
        dynamicData : _data.dynamicData,
        hierarchy   : ['d']
      });
    });
    it('The returned array should describe in which order the builder should travel the dynamicData without using depth attribute', function () {
      var _data = {
        staticData  : {},
        dynamicData : {
          d        : {name : ''       , type : 'object' , parent : ''        , xmlParts : [], depth : 500},
          menu1    : {name : 'menu'   , type : 'array'  , parent : 'd'      , xmlParts : [], depth : 4},
          menu2    : {name : 'menu'   , type : 'array'  , parent : 'menu1'   , xmlParts : [], depth : 2},
          menu3    : {name : 'menu'   , type : 'array'  , parent : 'menu2'   , xmlParts : [], depth : 3},
          product4 : {name : 'product', type : 'array'  , parent : 'menu3'   , xmlParts : [], depth : 4},
          site5    : {name : 'site'   , type : 'object' , parent : 'product4', xmlParts : [], depth : 4},
          product6 : {name : 'product', type : 'object' , parent : 'd'      , xmlParts : [], depth : 0},
          cars7    : {name : 'cars'   , type : 'object' , parent : 'd'      , xmlParts : [], depth : 0},
          product8 : {name : 'product', type : 'object' , parent : 'cars7'   , xmlParts : [], depth : 0}
        }
      };

      helper.assert(extracter.buildSortedHierarchy(_data), {
        staticData  : {},
        dynamicData : _data.dynamicData,
        hierarchy   : ['d', 'product6', 'cars7', 'product8', 'menu1', 'menu2', 'menu3', 'product4', 'site5']
      });
    });
    it('"cars7" should appears before "product8" because "cars7" is the parent of "product8".\
        "d" should be the first\
        "product6" should appears before "cars7" because "product6" has no children', function () {
      var _data = {
        staticData  : {},
        dynamicData : {
          product4 : {name : 'product', type : 'array'  , parent : 'menu3'   , xmlParts : [], depth : 4},
          menu3    : {name : 'menu'   , type : 'array'  , parent : 'menu2'   , xmlParts : [], depth : 3},
          menu1    : {name : 'menu'   , type : 'array'  , parent : 'd'      , xmlParts : [], depth : 1},
          menu2    : {name : 'menu'   , type : 'array'  , parent : 'menu1'   , xmlParts : [], depth : 2},
          product8 : {name : 'product', type : 'object' , parent : 'cars7'   , xmlParts : [], depth : 0},
          cars7    : {name : 'cars'   , type : 'object' , parent : 'd'      , xmlParts : [], depth : 0},
          product6 : {name : 'product', type : 'object' , parent : 'd'      , xmlParts : [], depth : 0},
          site5    : {name : 'site'   , type : 'object' , parent : 'product4', xmlParts : [], depth : 4},
          d        : {name : ''       , type : 'object' , parent : ''        , xmlParts : [], depth : 0}
        }
      };
      helper.assert(extracter.buildSortedHierarchy(_data), {
        staticData  : {},
        dynamicData : _data.dynamicData,
        hierarchy   : ['d', 'product6', 'cars7', 'product8', 'menu1', 'menu2', 'menu3', 'product4', 'site5']
      });
    });
    it('product should appears before menu3 because the former is an objec and the latter is an array.\
             cars should appears before menu1 because the former as a shorter branch', function () {
      var _data = {
        staticData  : {},
        dynamicData : {
          d       : {name : ''       , type : 'array'  , parent : ''        , xmlParts : [], depth : 0},
          menu1   : {name : 'menu'   , type : 'array'  , parent : 'd'       , xmlParts : [], depth : 4},
          menu2   : {name : 'menu'   , type : 'array'  , parent : 'menu1'   , xmlParts : [], depth : 2},
          menu3   : {name : 'menu'   , type : 'array'  , parent : 'menu2'   , xmlParts : [], depth : 3},
          product : {name : 'product', type : 'object' , parent : 'menu2'   , xmlParts : [], depth : 4},
          cars    : {name : 'cars'   , type : 'array'  , parent : 'd'       , xmlParts : [], depth : 0},
        }
      };
      helper.assert(extracter.buildSortedHierarchy(_data), {
        staticData  : {},
        dynamicData : _data.dynamicData,
        hierarchy   : ['d', 'cars', 'menu1', 'menu2', 'product', 'menu3']
      });
    });
    it('should work with a lot of arrays with the same depth', function () {
      var _data = {
        staticData  : {},
        dynamicData : {
          _root                         : {name : '_root'       , type : 'object', parent : ''                      , xmlParts : []            },
          _rootdmenuElements$$$element  : {name : 'element'     , type : 'object', parent : '_rootdmenuElements$$$' , xmlParts : [], depth : 1},
          _rootdmenuElements$           : {name : 'menuElements', type : 'array' , parent : '_rootd'                , xmlParts : [], depth : 1},
          _rootdmenuElements$$$$element : {name : 'element'     , type : 'object', parent : '_rootdmenuElements$$$$', xmlParts : [], depth : 1},
          _rootd                        : {name : 'd'           , type : 'array' , parent : '_root'                 , xmlParts : []            },
          _rootdmenuElementselement     : {name : 'element'     , type : 'object', parent : '_rootdmenuElements'    , xmlParts : [], depth : 1},
          _rootdmenuElements            : {name : 'menuElements', type : 'array' , parent : '_rootd'                , xmlParts : [], depth : 1},
          _rootdmenuElements$$$$        : {name : 'menuElements', type : 'array' , parent : '_rootd'                , xmlParts : [], depth : 1},
          _rootdmenuElements$$element   : {name : 'element'     , type : 'object', parent : '_rootdmenuElements$$'  , xmlParts : [], depth : 1},
          _rootdmenuElements$element    : {name : 'element'     , type : 'object', parent : '_rootdmenuElements$'   , xmlParts : [], depth : 1},
          _rootdmenuElements$$          : {name : 'menuElements', type : 'array' , parent : '_rootd'                , xmlParts : [], depth : 1},
          _rootdmenuElements$$$         : {name : 'menuElements', type : 'array' , parent : '_rootd'                , xmlParts : [], depth : 1},
        }
      };
      helper.assert(extracter.buildSortedHierarchy(_data), {
        staticData  : {},
        dynamicData : _data.dynamicData,
        hierarchy   : [
          '_root',
          '_rootd',
          '_rootdmenuElements',
          '_rootdmenuElementselement',
          '_rootdmenuElements$',
          '_rootdmenuElements$element',
          '_rootdmenuElements$$',
          '_rootdmenuElements$$element',
          '_rootdmenuElements$$$',
          '_rootdmenuElements$$$element',
          '_rootdmenuElements$$$$',
          '_rootdmenuElements$$$$element',
        ]
      });
    });
    it('should place object-only branches at the beginning of the hierarchy', function () {
      var _data = {
        staticData  : {},
        dynamicData : {
          _root                       : {name : '_root'       , type : 'object', parent : ''                      , xmlParts : []            },
          _rootdmenuElements$         : {name : 'menuElements', type : 'array' , parent : '_rootd'                , xmlParts : [], depth : 1},
          _rootd                      : {name : 'd'           , type : 'array' , parent : '_root'                 , xmlParts : []            },
          _rootdmenuElementselement   : {name : 'element'     , type : 'object', parent : '_rootdmenuElements'    , xmlParts : [], depth : 1},
          _rootdmenuElements          : {name : 'menuElements', type : 'array' , parent : '_rootd'                , xmlParts : [], depth : 1},
          _rootdmenuElements$$element : {name : 'element'     , type : 'object', parent : '_rootdmenuElements$$'  , xmlParts : [], depth : 1},
          _rootdmenuElements$element  : {name : 'element'     , type : 'object', parent : '_rootdmenuElements$'   , xmlParts : [], depth : 1},
          _rootdmenuElements$$        : {name : 'menuElements', type : 'array' , parent : '_rootd'                , xmlParts : [], depth : 1},
          _rootc                      : {name : 'c'           , type : 'object', parent : '_root'                 , xmlParts : []            },
          _rootccar                   : {name : 'car'         , type : 'object', parent : '_rootc'                , xmlParts : []            },
          _rootccarwheel              : {name : 'wheel'       , type : 'object', parent : '_rootccar'             , xmlParts : []            },
          _rootccarwheeltest          : {name : 'test'        , type : 'object', parent : '_rootccarwheel'        , xmlParts : []            }
        }
      };
      helper.assert(extracter.buildSortedHierarchy(_data), {
        staticData  : {},
        dynamicData : _data.dynamicData,
        hierarchy   : [
          '_root',
          '_rootc',
          '_rootccar',
          '_rootccarwheel',
          '_rootccarwheeltest',
          '_rootd',
          '_rootdmenuElements',
          '_rootdmenuElementselement',
          '_rootdmenuElements$',
          '_rootdmenuElements$element',
          '_rootdmenuElements$$',
          '_rootdmenuElements$$element',
        ]
      });
    });
    it('should keep the dependency between arrays while  all item of a branch', function () {
      var _data = {
        staticData  : {},
        dynamicData : {
          _root                      : { name : '_root'         , type : 'object', parent : ''                   , depth : 1},
          _rootd                     : { name : 'd'             , type : 'array' , parent : '_root'              , depth : 1},
          _rootd$menuElements        : { name : 'menuElements'  , type : 'array' , parent : '_rootd$'            , depth : 2},
          _rootd$mealType            : { name : 'mealType'      , type : 'object', parent : '_rootd$'            , depth : 1},
          _rootdmealType             : { name : 'mealType'      , type : 'object', parent : '_rootd'             , depth : 1},
          _rootdmenuElements         : { name : 'menuElements'  , type : 'array' , parent : '_rootd'             , depth : 2},
          _rootdmenuElementselement  : { name : 'element'       , type : 'object', parent : '_rootdmenuElements' , depth : 2},
          _rootd$                    : { name : 'd'             , type : 'array' , parent : '_root'              , depth : 1},
          _rootd$menuElementselement : { name : 'element'       , type : 'object', parent : '_rootd$menuElements', depth : 2}
        }
      };
      helper.assert(extracter.buildSortedHierarchy(_data), {
        staticData  : {},
        dynamicData : _data.dynamicData,
        hierarchy   : [
          '_root',
          '_rootd',
          '_rootdmealType',
          '_rootdmenuElements',
          '_rootdmenuElementselement',
          '_rootd$',
          '_rootd$mealType',
          '_rootd$menuElements',
          '_rootd$menuElementselement'
        ]
      });
    });
    it('should push objects above while keeping the dependency ', function () {
      var _data = {
        staticData  : {},
        dynamicData : {
          d      : {name : ''       , type : 'array'  , parent : ''        , xmlParts : [], depth : 500},
          menu1  : {name : 'menu'   , type : 'array'  , parent : 'd'       , xmlParts : [], depth : 4},
          menu2  : {name : 'menu'   , type : 'object' , parent : 'menu1'   , xmlParts : [], depth : 2},
          menu3  : {name : 'menu'   , type : 'array'  , parent : 'menu2'   , xmlParts : [], depth : 2},
          cars1  : {name : 'cars'   , type : 'array'  , parent : 'd'       , xmlParts : [], depth : 0},
          cars02 : {name : 'cars'   , type : 'object' , parent : 'cars1'   , xmlParts : [], depth : 0},
          cars3  : {name : 'cars'   , type : 'array'  , parent : 'cars02'   , xmlParts : [], depth : 0},
        }
      };
      helper.assert(extracter.buildSortedHierarchy(_data), {
        staticData  : {},
        dynamicData : _data.dynamicData,
        hierarchy   : ['d', 'cars1', 'cars02', 'cars3', 'menu1', 'menu2', 'menu3']
      });
    });
  });

  // Many complex cases are tested indirectly in other tests
  describe('sortXmlParts', function () {
    it('should sort the array of xml parts', function () {
      var _data = [
        { obj : '_rootd', pos : 31 },
        { obj : '_rootd', pos : 14 }
      ];
      extracter.sortXmlParts(_data);
      helper.assert(_data, [
        { obj : '_rootd', pos : 14 },
        { obj : '_rootd', pos : 31 }
      ]);
    });
    it('should sort correctly nested arrays which start at the same position in xml.\
      This happens when two arrays are incremented in the same time (d.tab[i+1].subtab[i+1])', function () {
      // This test is sensible.
      var _data = [
        { obj : '_rootdother'           , pos : 90                  },
        { obj : '_rootdfamiliesproducts', pos : 50, array : 'start' }, // sub array
        { obj : '_rootd'                , pos : 31                  },
        { obj : '_rootdfamilies'        , pos : 50, array : 'start' }, // array
        { obj : '_rootdfamiliesproducts', pos : 70, array : 'end'   }, // sub array
        { obj : '_rootdfamilies'        , pos : 70, array : 'end'   }, // array
        { obj : '_rootdfamiliesproducts', pos : 65                  }, // sub array attribute
        { obj : '_rootd'                , pos : 14                  },
      ];
      extracter.sortXmlParts(_data);
      helper.assert(_data, [
        { obj : '_rootd'                , pos : 14                  },
        { obj : '_rootd'                , pos : 31                  },
        { obj : '_rootdfamilies'        , pos : 50, array : 'start' }, // array
        { obj : '_rootdfamiliesproducts', pos : 50, array : 'start' }, // sub array
        { obj : '_rootdfamiliesproducts', pos : 65                  }, // sub array attribute
        { obj : '_rootdfamiliesproducts', pos : 70, array : 'end'   }, // sub array
        { obj : '_rootdfamilies'        , pos : 70, array : 'end'   }, // array
        { obj : '_rootdother'           , pos : 90                  }
      ]);
    });
  });

  describe('deleteAndMoveNestedParts', function () {
    it('should move xml parts which have the attribute "moveTo" into the corresponding array.\
      it should delete xmlParts which contains the attribute "toDelete"', function () {
      var _data = {
        dynamicData : {
          _root : {
            name     : '_root',
            type     : 'object',
            parent   : '',
            xmlParts : []
          },
          _rootd : {
            name     : 'd',
            type     : 'object',
            parent   : '_root',
            xmlParts : [
              {obj : '_rootd', attr : 'root', pos : 12, depth : 1, after : ' ', moveTo : '_rootdcars'},
              {obj : '_rootd', attr : 'root', pos : 30, depth : 1, before : '', toDelete : true       }
            ],
            depth : 1
          },
          _rootdcars : {
            name      : 'cars',
            type      : 'array',
            parent    : '_rootd',
            position  : {start : 5,end : 22, endOdd : 40},
            iterators : [{ attr : 'i' }],
            xmlParts  : [
              {obj : '_rootdcars', attr : 'brand' , pos : 13, depth : 1                        },
              {obj : '_rootdcars', array : 'start', pos : 5 , depth : 1, after : '<t_row>'    },
              {obj : '_rootdcars', array : 'end'  , pos : 22, depth : 1, before : ' </t_row>' }
            ],
            depth : 1
          }
        }
      };
      var _dataModified = extracter.deleteAndMoveNestedParts(_data).dynamicData;
      helper.assert(_dataModified._rootd.xmlParts, []);
      helper.assert(_dataModified._rootdcars.xmlParts, [
        {obj : '_rootdcars', attr : 'brand' , pos : 13, depth : 1                         },
        {obj : '_rootdcars', array : 'start', pos : 5 , depth : 1, after : '<t_row>'     },
        {obj : '_rootdcars', array : 'end'  , pos : 22, depth : 1, before : ' </t_row>'  },
        {obj : '_rootd'    , attr : 'root'  , pos : 12, depth : 1, after : ' '           }
      ]);
    });
  });

});


