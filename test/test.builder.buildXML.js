var assert = require('assert');
var builder = require('../lib/builder');
var helper = require('../lib/helper');

describe('builder.buildXML', function () {

  it.skip('should work if the same array is repeated two times in the xml <tr>d[i].product</tr>    <tr>d[i].product</tr>');
  it.skip('should escape special characters > < & " \' even if a formatter is used (output of a formatter)');
  it('should return the xml if no data is passed', function (done) {
    var _xml = '<xml> </xml>';
    builder.buildXML(_xml, null, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> </xml>');
      done();
    });
  });
  it('should replace a simple tag by the data', function (done) {
    var _xml = '<xml> {d.title} </xml>';
    var _data = {title : 'boo'};
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> boo </xml>');
      done();
    });
  });
  it('should replace control codes that makes problem in LibreOffice', function (done) {
    var str = 'boo';
    for (var i = 0 ; i < 160 ; i++) {
      if ((i >= 0 && i <= 8) ||
          (i >= 10 && i <= 12) ||
          (i >= 14 && i <= 31) ||
          (i >= 127 && i <= 159)) {
        str += String.fromCharCode(i);
      }
    }
    var _xml = '<xml> {d.title} </xml>';
    var _data = {title : str};
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> boo </xml>');
      done();
    });
  });
  it('should not replace control codes like space, carriage return and tab', function (done) {
    var str = 'boo';
    str += String.fromCharCode(9);
    str += String.fromCharCode(13);
    str += String.fromCharCode(32);
    var _xml = '<xml> {d.title} </xml>';
    var _data = {title : str};
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> boo\u0009\u000D\u0020 </xml>');
      done();
    });
  });
  it('should not remove marker which do not contain {d. {d[ {c. {c[ {$ {# {t(', function (done) {
    var _xml = '<ds:datastoreItem ds:itemID="{5C3EA648-9B80-B142-9BDE-D25C08381CE2}"></ds>'
             + '{tssd}'
             + '{m.}';
    builder.buildXML(_xml, {}, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<ds:datastoreItem ds:itemID="{5C3EA648-9B80-B142-9BDE-D25C08381CE2}"></ds>{tssd}{m.}');
      done();
    });
  });
  it('should accept a second object which is accessible with the marker {c.}, c as "complement"', function (done) {
    var _xml = '<xml> {d.title} {c.date} </xml>';
    var _data = {title : 'boo'};
    var _complement = {date : 'today'};
    builder.buildXML(_xml, _data, {complement : _complement}, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> boo today </xml>');
      done();
    });
  });
  it('should replace null or undefined data by an empty string', function (done) {
    var _xml = '<xml> {d.title} </xml>';
    builder.buildXML(_xml, {title : null}, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml>  </xml>');
      builder.buildXML(_xml, {title : undefined}, function (err, _xmlBuilt) {
        helper.assert(_xmlBuilt, '<xml>  </xml>');
        done();
      });
    });
  });
  it('should replace null or undefined data inside a nested object by an empty string', function (done) {
    var _xml = '<xml> {d.foo.bar.baz} </xml>';
    var _data = {};
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml>  </xml>');
      done();
    });
  });
  it('should escape special characters > < & for XML', function (done) {
    var _xml = '<xml> {d.title} </xml>';
    builder.buildXML(_xml, {title : '&'}, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> &amp; </xml>');
      builder.buildXML(_xml, {title : '<'}, function (err, _xmlBuilt) {
        helper.assert(_xmlBuilt, '<xml> &lt; </xml>');
        builder.buildXML(_xml, {title : '>'}, function (err, _xmlBuilt) {
          helper.assert(_xmlBuilt, '<xml> &gt; </xml>');
          builder.buildXML(_xml, {title : 'a & b c <table> <> & <'}, function (err, _xmlBuilt) {
            helper.assert(_xmlBuilt, '<xml> a &amp; b c &lt;table&gt; &lt;&gt; &amp; &lt; </xml>');
            done();
          });
        });
      });
    });
  });
  it('should works with two nested objects', function (done) {
    var _xml = '<xml> {d.title} <br> {d.city.id} </xml>';
    var _data = {
      title : 'boo',
      city  : {
        id : 5
      }
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> boo <br> 5 </xml>');
      done();
    });
  });
  it('should remove the tags if the data is not what you expect', function (done) {
    var _xml = '<xml> {d.title} <br> {d.city.id} </xml>';
    var _data = {
      bullshit : 'boo'
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml>  <br>  </xml>');
      done();
    });
  });
  it('should remove the tags part if the data is not provided', function (done) {
    var _xml = '<xml> {d.title} <br> {d.city.id} </xml>';
    var _data = {
      title : 'boo'
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> boo <br>  </xml>');
      done();
    });
  });
  it('should automatically repeat the xml if the root is an array of objects', function (done) {
    var _xml = '<xml> <t_row> {d[i].brand} </t_row><t_row> {d[i+1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'},
      {brand : 'Tesla motors'},
      {brand : 'Toyota'}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
      done();
    });
  });
  it('should works even if there are some empty rows between the two repetition markers', function (done) {
    var _xml = '<xml> <t_row> {d[i].brand} </t_row> <t_row></t_row> <t_row> {d[i+1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'},
      {brand : 'Tesla motors'}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row> <t_row></t_row> <t_row> Tesla motors </t_row> <t_row></t_row> </xml>');
      done();
    });
  });
  it('should handle array in an object', function (done) {
    var _xml = '<xml><t_row> {d.cars[i].brand} </t_row><t_row> {d.cars[i+1].brand} </t_row></xml>';
    var _data = {
      cars : [
        {brand : 'Lumeneo'},
        {brand : 'Tesla motors'},
        {brand : 'Toyota'}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
      done();
    });
  });
  it('should repeat d.who if it is inside a repetition section', function (done) {
    var _xml = '<xml><tr>{d.who} {d.cars[i].brand} </tr><tr> {d.who} {d.cars[i+1].brand} </tr></xml>';
    var _data = {
      who  : 'my',
      cars : [
        {brand : 'Lumeneo'},
        {brand : 'Tesla motors'},
        {brand : 'Toyota'}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><tr>my Lumeneo </tr><tr>my Tesla motors </tr><tr>my Toyota </tr></xml>');
      done();
    });
  });
  it('should accept custom iterators and sort the data using this iterator', function (done) {
    var _xml = '<xml><t_row> {d.cars[sort].brand} </t_row><t_row> {d.cars[sort+1].brand} </t_row></xml>';
    var _data = {
      cars : [
        {brand : 'Lumeneo'     , sort : 3},
        {brand : 'Tesla motors', sort : 1},
        {brand : 'Toyota'      , sort : 2}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><t_row> Tesla motors </t_row><t_row> Toyota </t_row><t_row> Lumeneo </t_row></xml>');
      done();
    });
  });
  it('should use keep the first element of the array if the custom iterator is constant (always equals 1)', function (done) {
    var _xml = '<xml><t_row> {d.cars[sort].brand} </t_row><t_row> {d.cars[sort+1].brand} </t_row></xml>';
    var _data = {
      cars : [
        {brand : 'Lumeneo'     , sort : 1},
        {brand : 'Tesla motors', sort : 1},
        {brand : 'Toyota'      , sort : 1}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><t_row> Tesla motors </t_row></xml>');
      done();
    });
  });
  it('should accept two iterators', function (done) {
    var _xml = '<xml><t_row> {d.cars[sort,i].brand} </t_row><t_row> {d.cars[sort+1,i+1].brand} </t_row></xml>';
    var _data = {
      cars : [
        {brand : 'Lumeneo'     , sort : 1},
        {brand : 'Tesla motors', sort : 2},
        {brand : 'Toyota'      , sort : 1}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><t_row> Lumeneo </t_row><t_row> Toyota </t_row><t_row> Tesla motors </t_row></xml>');
      done();
    });
  });
  it('should accept three iterators', function (done) {
    var _xml = '<xml><t_row> {d.cars[speed, sort,i].brand} </t_row><t_row> {d.cars[speed+1, sort+1, i+1].brand} </t_row></xml>';
    var _data = {
      cars : [
        {brand : 'fourth', speed : 'c', sort : 1},
        {brand : 'fifth' , speed : 'c', sort : 1},
        {brand : 'first' , speed : 'a', sort : 2},
        {brand : 'third' , speed : 'b', sort : 2},
        {brand : 'second', speed : 'b', sort : 1}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><t_row> first </t_row><t_row> second </t_row><t_row> third </t_row><t_row> fourth </t_row><t_row> fifth </t_row></xml>');
      done();
    });
  });
  it('should select only one element if the iterator is always null ???', function (done) {
    var _xml = '<xml><t_row> {d.cars[sort].brand} </t_row><t_row> {d.cars[sort+1].brand} </t_row></xml>';
    var _data = {
      cars : [
        {brand : 'Lumeneo'     , sort : null},
        {brand : 'Tesla motors', sort : null},
        {brand : 'Toyota'      , sort : null}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><t_row> Tesla motors </t_row></xml>');
      done();
    });
  });
  it.skip('should use the default order of the array if the custom iterator is undefined', function (done) {
    var _xml = '<xml><t_row> {d.cars[sort].brand} </t_row><t_row> {d.cars[sort+1].brand} </t_row></xml>';
    var _data = {
      cars : [
        {brand : 'Lumeneo'     , sort : undefined},
        {brand : 'Tesla motors', sort : undefined},
        {brand : 'Toyota'      , sort : undefined}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
      done();
    });
  });
  it('should work if there is a whitespace between "cars" and "[" in some tags', function (done) {
    var _xml = '<xml><t_row> {d.cars[i].brand} </t_row><t_row> {d.cars [i+1].brand} </t_row></xml>';
    var _data = {
      cars : [
        {brand : 'Lumeneo'},
        {brand : 'Tesla motors'},
        {brand : 'Toyota'}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
      done();
    });
  });
  it('should detect repetition even if there is only one self-closing tag between the two parts (with whitespaces)', function (done) {
    var _xml = '<xml><p><p><br/></p></p>{d[i].brand}  <br/>{d[i+1].brand}  <br/></xml>';
    var _data = [
      {brand : 'Lumeneo'},
      {brand : 'Tesla motors'}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml><p><p><br/></p></p>Lumeneo  <br/>Tesla motors  <br/></xml>');
      done();
    });
  });
  it.skip('should work even if there are only self-closing tags', function (done) {
    var _xml = '<xml> <br/> {d[i].brand} <br/> <br/><br/> <br/> {d[i+1].brand} <br/></xml>';
    var _data = [
      {brand : 'Lumeneo'},
      {brand : 'Tesla motors'}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <br/> Lumeneo <br/> <br/><br/> <br/> Tesla motors <br/> <br/><br/> </xml>');
      done();
    });
  });
  it('should manage nested arrays', function (done) {
    var _xml =
       '<xml>'
      +  '<t_row><td>{d.cars[i].wheels[i].size  }</td><td>{d.cars[i].wheels[i+1].size  }</td></t_row>'
      +  '<t_row><td>{d.cars[i+1].wheels[i].size}</td><td>{d.cars[i+1].wheels[i+1].size}</td></t_row>'
      +'</xml>';
    var _data = {
      cars : [
        {wheels : [ {size : 'A'}, {size : 'B'}               ]},
        {wheels : [ {size : 'C'}, {size : 'D'},{size : 'E'} ]}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><t_row><td>A</td><td>B</td></t_row><t_row><td>C</td><td>D</td><td>E</td></t_row></xml>');
      done();
    });
  });
  it('should manage two adjacents arrays within an array. It should accept partial repetitions (only {d[i+1].site.label} is set)', function (done) {
    var _xml =
       '<xml>'
      +  '<table>'
      +  '<h1>{d[i].site.label}</h1>'
      +  '<cell><t_row>{d[i].cars[i].size}</t_row>'
      +  '<t_row>{d[i].cars[i+1].size}</t_row></cell>'
      +  '<cell><t_row>{d[i].trucks[i].size}</t_row>'
      +  '<t_row>{d[i].trucks[i+1].size}</t_row></cell>'
      +  '</table>'
      +  '<table>'
      +  '<h1>{d[i+1].site.label}</h1>'
      +  '</table>'
      +'</xml>';
    var _data = [{
      site   : {label : 'site_A'},
      cars   : [ {size : 'A'}, {size : 'B'}  ],
      trucks : [ {size : 'X'} ]
    }];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><table><h1>site_A</h1><cell><t_row>A</t_row><t_row>B</t_row></cell><cell><t_row>X</t_row></cell></table></xml>');
      done();
    });
  });
  it('should manage nested object with two adjacents arrays within an array. It should accept partial repetitions (only {d[i+1].site.label} is set)', function (done) {
    var _xml =
       '<xml>'
      +  '<table>'
      +  '<h1>{d[i].site.label}</h1>'
      +  '<cell><t_row><td>{d[i].cars[i].size}</td><td>{d[i].cars[i].spec.qty}</td></t_row>'
      +  '<t_row><td>{d[i].cars[i+1].size}</td><td>{d[i].cars[i+1].spec.qty}</td></t_row></cell>'
      +  '<cell><t_row><td>{d[i].trucks[i].size}</td></t_row>'
      +  '<t_row><td>{d[i].trucks[i+1].size}</td></t_row></cell>'
      +  '</table>'
      +  '<table>'
      +  '<h1>{d[i+1].site.label}</h1>'
      +  '</table>'
      +'</xml>';
    var _data = [{
      site   : {label : 'site_A'},
      cars   : [ {size : 'A', spec : {qty : 1}}, {size : 'B', spec : {qty : 2}}  ],
      trucks : [ {size : 'X'} ]
    }];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><table><h1>site_A</h1><cell><t_row><td>A</td><td>1</td></t_row><t_row><td>B</td><td>2</td></t_row></cell><cell><t_row><td>X</td></t_row></cell></table></xml>');
      done();
    });
  });
  it('1. should manage 3 levels of arrays with nested objects even if the xml tags are the same everywhere (td)', function (done) {
    var _xml =
       '<xml>'
      +  '<td>'
        +  '<h1>{d[i].site.label}</h1>'
        +  '<td>'
          +  '<td>{d[i].cars[i].name} {d[i].cars[i].autonomy} <td>{d[i].cars[i].spec.weight}</td></td>'
            +  '<td>{d[i].cars[i].wheels[i].strengh} {d[i].cars[i].wheels[i].tire.brand}</td>'
            +  '<td>{d[i].cars[i].wheels[i+1].strengh} {d[i].cars[i].wheels[i+1].tire.brand}</td>'
        +  '</td>'
        +  '<td>'
          +  '<td>{d[i].cars[i+1].name} {d[i].cars[i+1].autonomy} <td>{d[i].cars[i+1].spec.weight}</td></td>'
        +  '</td>'
        +  '<td>'
          +  '<td>{d[i].trucks[i].name}</td>'
          +  '<td>{d[i].trucks[i+1].name}</td>'
        +  '</td>'
      +  '</td>'
      +  '<td>'
        +  '<h1>{d[i+1].site.label}</h1>'
      +  '</td>'
      +'</xml>';
    var _data = [
      {
        site : {label : 'site_A'},
        cars : [
          {
            name     : 'prius',
            autonomy : 7,
            spec     : {weight : 1},
            wheels   : [
              {strengh : 's1', tire : {brand : 'mich'}}
            ]
          },
          {
            name     : 'civic',
            autonomy : 0,
            spec     : {weight : 2},
            wheels   : [
              {strengh : 's2', tire : {brand : 'mich'}}
            ]
          },
        ],
        trucks : [ {name : 'scania'} ]
      },{
        site   : {label : 'site_B'},
        cars   : [ ],
        trucks : [ {name : 'daf'}, {name : 'hyundai'} ]
      }
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      var _expectedResult =
         '<xml>'
        +  '<td>'
          +  '<h1>site_A</h1>'
          +  '<td>'
            +  '<td>prius 7 <td>1</td></td>'
              +  '<td>s1 mich</td>'
          +  '</td>'
          +  '<td>'
            +  '<td>civic 0 <td>2</td></td>'
              +  '<td>s2 mich</td>'
          +  '</td>'
          +  '<td>'
            +  '<td>scania</td>'
          +  '</td>'
        +  '</td>'
        +  '<td>'
          +  '<h1>site_B</h1>'
          +  '<td>'
            +  '<td>daf</td>'
            +  '<td>hyundai</td>'
          +  '</td>'
        +  '</td>'
        +'</xml>';
      assert.equal(_xmlBuilt, _expectedResult);
      done();
    });
  });
  it('should repeat automatically all markers which are on the same row of a deeper array (third level here). It will flatten the JSON', function (done) {
    var _xml =
       '<xml>'
      +  '<tr>'
      +    '<td>{d[i].site.label}</td>'
      +    '<td>{d[i].cars[i].name} {d[i].cars[i].autonomy}</td>'
      +    '<td>{d[i].cars[i].spec.weight}</td>'
      +    '<td>{d[i].cars[i].wheels[i].strengh} {d[i].cars[i].wheels[i].tire.brand}</td>'
      +  '</tr>'
      +  '<tr>'
      +    '<td>{d[i+1].site.label}</td>'
      +    '<td>{d[i+1].cars[i+1].name} {d[i+1].cars[i+1].autonomy}</td>'
      +    '<td>{d[i+1].cars[i+1].spec.weight}</td>'
      +    '<td>{d[i+1].cars[i+1].wheels[i+1].strengh} {d[i+1].cars[i+1].wheels[i+1].tire.brand}</td>'
      +  '</tr>'
      +'</xml>';
    var _data = [
      {
        site : {label : 'site_A'},
        cars : [
          {
            name     : 'prius',
            autonomy : 7,
            spec     : {weight : 1},
            wheels   : [
              {strengh : 's1', tire : {brand : 'mich'}},
              {strengh : 's2', tire : {brand : 'cont'}}
            ]
          },
          {
            name     : 'civic',
            autonomy : 0,
            spec     : {weight : 2},
            wheels   : [
              {strengh : 's2', tire : {brand : 'mich'}}
            ]
          },
        ],
      },{
        site : {label : 'site_B'},
        cars : [{
          name     : 'modelS',
          autonomy : 4,
          spec     : {weight : 1},
          wheels   : [
              {strengh : 's1', tire : {brand : 'mich'}},
              {strengh : 's2', tire : {brand : 'uni' }},
              {strengh : 's3', tire : {brand : 'cont'}}
          ]
        }
        ],
      }
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      var _expectedResult =
         '<xml>'
        +  '<tr>'
        +    '<td>site_A</td>'
        +    '<td>prius 7</td>'
        +    '<td>1</td>'
        +    '<td>s1 mich</td>'
        +  '</tr>'
        +  '<tr>'
        +    '<td>site_A</td>'
        +    '<td>prius 7</td>'
        +    '<td>1</td>'
        +    '<td>s2 cont</td>'
        +  '</tr>'
        +  '<tr>'
        +    '<td>site_A</td>'
        +    '<td>civic 0</td>'
        +    '<td>2</td>'
        +    '<td>s2 mich</td>'
        +  '</tr>'
        +  '<tr>'
        +    '<td>site_B</td>'
        +    '<td>modelS 4</td>'
        +    '<td>1</td>'
        +    '<td>s1 mich</td>'
        +  '</tr>'
        +  '<tr>'
        +    '<td>site_B</td>'
        +    '<td>modelS 4</td>'
        +    '<td>1</td>'
        +    '<td>s2 uni</td>'
        +  '</tr>'
        +  '<tr>'
        +    '<td>site_B</td>'
        +    '<td>modelS 4</td>'
        +    '<td>1</td>'
        +    '<td>s3 cont</td>'
        +  '</tr>'
        +'</xml>';
      assert.equal(_xmlBuilt, _expectedResult);
      done();
    });
  });
  it('should repeat automatically all markers which are on the same row of a deeper array\
      Special case here where the third level is written first and the second level is not written', function (done) {
    var _xml =
       '<xml>'
      +  '<tr>'
      +    '<td>{d[i].cars[i].wheels[i].tire.brand}</td>'
      +    '<td>{d[i].site.label}</td>'
      +  '</tr>'
      +  '<tr>'
      +    '<td>{d[i+1].cars[i+1].wheels[i+1].tire.brand}</td>'
      +    '<td>{d[i+1].site.label}</td>'
      +  '</tr>'
      +'</xml>';
    var _data = [
      {
        site : {label : 'site_A'},
        cars : [
          {
            wheels : [
              {tire : {brand : 'mich'}},
              {tire : {brand : 'cont'}}
            ]
          },
          {
            wheels : [
              {tire : {brand : 'mich'}}
            ]
          },
        ],
      },{
        site : {label : 'site_B'},
        cars : [{
          wheels : [
              {tire : {brand : 'mich'}},
              {tire : {brand : 'uni' }},
              {tire : {brand : 'cont'}}
          ]
        }
        ],
      }
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      var _expectedResult =
         '<xml>'
        +  '<tr>'
        +    '<td>mich</td>'
        +    '<td>site_A</td>'
        +  '</tr>'
        +  '<tr>'
        +    '<td>cont</td>'
        +    '<td>site_A</td>'
        +  '</tr>'
        +  '<tr>'
        +    '<td>mich</td>'
        +    '<td>site_A</td>'
        +  '</tr>'
        +  '<tr>'
        +    '<td>mich</td>'
        +    '<td>site_B</td>'
        +  '</tr>'
        +  '<tr>'
        +    '<td>uni</td>'
        +    '<td>site_B</td>'
        +  '</tr>'
        +  '<tr>'
        +    '<td>cont</td>'
        +    '<td>site_B</td>'
        +  '</tr>'
        +'</xml>';
      assert.equal(_xmlBuilt, _expectedResult);
      done();
    });
  });
  it('should manage nested arrays with complex iterators', function (done) {
    var _xml =
       '<xml>'
      +  '<t_row><td>{d.cars[driver.name].wheels[size].size  }</td><td>{d.cars[driver.name].wheels[size+1].size  }</td></t_row>'
      +  '<t_row><td>{d.cars[driver.name+1].wheels[size].size}</td><td>{d.cars[driver.name+1].wheels[size+1].size}</td></t_row>'
      +'</xml>';
    var _data = {
      cars : [
        {
          wheels : [ {size : 'B'}, {size : 'A'}                ],
          driver : {name : 'david'}
        },
        {
          wheels : [ {size : 'D'}, {size : 'C'}, {size : 'E'} ],
          driver : {name : 'bob'}
        }
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><t_row><td>C</td><td>D</td><td>E</td></t_row><t_row><td>A</td><td>B</td></t_row></xml>');
      done();
    });
  });
  it('should work with two adjacents arrays and some xml in between. It should work even if there are a lot of whitespaces ', function (done) {
    var _xml =
       '<xml>'
      +  '<t_cars>   <td>{  d.cars[ i ].brand   } </td> <td>{   d.cars[i + 1 ].brand   } </td> </t_cars>'
      +  '<oo> hello </oo>'
      +  '<t_wheels> <td>{  d.wheels[ i ].size  } </td> <td>{   d.wheels[ i + 1].size  } </td> </t_wheels>'
      +'</xml>';
    var _data = {
      cars   : [ {brand : 'Tesla'}, {brand : 'Lumeneo'}, {brand : 'Venturi'} ],
      wheels : [ {size : 'A'},      {size : 'B'} ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><t_cars>   <td>Tesla </td> <td>Lumeneo </td> <td>Venturi </td>  </t_cars><oo> hello </oo><t_wheels> <td>A </td> <td>B </td>  </t_wheels></xml>');
      done();
    });
  });
  it('should accept condition "=" in arrays', function (done) {
    var _xml = '<xml> <t_row> {d[speed=100,i].brand} </t_row><t_row> {d[  speed =  100 ,  i+1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , speed : 100},
      {brand : 'Tesla motors', speed : 200},
      {brand : 'Toyota'      , speed : 100}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Toyota </t_row></xml>');
      done();
    });
  });
  it('should manage conditions with nested arrays', function (done) {
    var _xml =
       '<xml>'
      +  '<t_row><td>{d.cars[speed>10, i].wheels[size>6, i].size  }</td><td>{d.cars[speed>10, i].wheels[size>6, i+1].size  }</td></t_row>'
      +  '<t_row><td>{d.cars[speed>10, i+1].wheels[size>6, i].size}</td><td>{d.cars[speed>10, i+1].wheels[size>6, i+1].size}</td></t_row>'
      +'</xml>';
    var _data = {
      cars : [
        {wheels : [ {size : 5}, {size : 10}              ], speed : 5},
        {wheels : [ {size : 5}, {size : 10},{size : 20} ], speed : 20}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><t_row><td>10</td><td>20</td></t_row></xml>');
      done();
    });
  });
  it('should accept condition ">" in arrays', function (done) {
    var _xml = '<xml> <t_row> {d[speed>100,i].brand} </t_row><t_row> {d[  speed >  100 ,  i+1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , speed : 50},
      {brand : 'Tesla motors', speed : 200},
      {brand : 'Toyota'      , speed : 100}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Tesla motors </t_row></xml>');
      done();
    });
  });
  it('should accept condition encoded ">" in arrays', function (done) {
    var _xml = '<xml> <t_row> {d[speed&gt;100,i].brand} </t_row><t_row> {d[  speed &gt;  100 ,  i+1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , speed : 50},
      {brand : 'Tesla motors', speed : 200},
      {brand : 'Toyota'      , speed : 100}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Tesla motors </t_row></xml>');
      done();
    });
  });
  it('should accept condition "<" in arrays', function (done) {
    var _xml = '<xml> <t_row> {d[speed<200,i].brand} </t_row><t_row> {d[  speed <  200 ,  i+1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , speed : 150},
      {brand : 'Tesla motors', speed : 200},
      {brand : 'Toyota'      , speed : 100}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Toyota </t_row></xml>');
      done();
    });
  });
  it('should accept condition encoded "<" in arrays', function (done) {
    var _xml = '<xml> <t_row> {d[speed&lt;200,i].brand} </t_row><t_row> {d[  speed &lt;  200 ,  i+1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , speed : 150},
      {brand : 'Tesla motors', speed : 200},
      {brand : 'Toyota'      , speed : 100}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Toyota </t_row></xml>');
      done();
    });
  });
  it('should accept multiple conditions in arrays', function (done) {
    var _xml = '<xml> <t_row> {d[speed=100, high < 15, i].brand} </t_row><t_row> {d[speed=100, high < 15,i+1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , speed : 100, high : 12},
      {brand : 'Tesla motors', speed : 200, high : 5},
      {brand : 'Toyota'      , speed : 100, high : 44}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row></xml>');
      done();
    });
  });
  it('should accept conditions using length of the array', function (done) {
    var _xml = '<xml> <t_row> {d[drivers.length>0, i].brand} </t_row><t_row> {d[drivers.length>0, i+1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , drivers : ['bob', 'martin']},
      {brand : 'Tesla motors', drivers : []},
      {brand : 'Toyota'      , drivers : ['david', 'leonardo']}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Toyota </t_row></xml>');
      done();
    });
  });
  it('should accept conditions in a nested object', function (done) {
    var _xml = '<xml> <t_row> {d[ speed . high > 13, i].brand} </t_row><t_row> {d[ speed.high > 13,i+1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , speed : {high : 12, low : 1}},
      {brand : 'Tesla motors', speed : {high : 5 , low : 2 }},
      {brand : 'Toyota'      , speed : {high : 44, low : 20}}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Toyota </t_row></xml>');
      done();
    });
  });
  it('should accept comparison operatior !=', function (done) {
    var _xml = '<xml> <t_row> {d[ speed.high!=5, i].brand} </t_row><t_row> {d[ speed.high != 5,i+1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , speed : {high : 12, low : 1}},
      {brand : 'Tesla motors', speed : {high : 5 , low : 2 }},
      {brand : 'Toyota'      , speed : {high : 44, low : 20}}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Toyota </t_row></xml>');
      done();
    });
  });
  it('should accept comparison operatior != with a lot of whitespaces', function (done) {
    var _xml = '<xml> <t_row> {d[ speed . high !  =  5, i].brand} </t_row><t_row> {d[ speed.high  !   = 5,  i+1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , speed : {high : 12, low : 1}},
      {brand : 'Tesla motors', speed : {high : 5 , low : 2 }},
      {brand : 'Toyota'      , speed : {high : 44, low : 20}}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Toyota </t_row></xml>');
      done();
    });
  });
  it('should accept two conditions on the same object-attribute. It should accept extra whitespaces in the condition', function (done) {
    var _xml = '<xml> <t_row> {d[ speed . high > 8, s pe ed.h igh < 20, i].brand} </t_row><t_row> {d[ speed.high > 8, speed.high < 20, i+1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , speed : {high : 12, low : 1}},
      {brand : 'Tesla motors', speed : {high : 5 , low : 2 }},
      {brand : 'Toyota'      , speed : {high : 44, low : 20}}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row></xml>');
      done();
    });
  });
  it.skip('should accept than the conditions is repeated multiples times (should not jave a variable declared two times in the builder)', function (done) {
    // TODO
    var _xml = '<xml> <t_row> {d[ speed . high > 8, s pe ed.h igh < 20, i].brand} </t_row><t_row> {d[ speed.high > 8, speed.high < 20, i+1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , speed : {high : 12, low : 1}},
      {brand : 'Tesla motors', speed : {high : 5 , low : 2 }},
      {brand : 'Toyota'      , speed : {high : 44, low : 20}}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row></xml>');
      done();
    });
  });
  it('AAshould work if the same array is repeated two times in the xml', function (done) {
    var _xml = '<xml> <t_row> {d[i].brand} </t_row><t_row> {d[i+1].brand} </t_row><t_row> {d[i].brand} </t_row><t_row> {d[i+1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'},
      {brand : 'Tesla motors'},
      {brand : 'Toyota'}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row><t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
      done();
    });
  });
  it('should work if the same array is repeated two times in the xml and there are condition is in a sub array', function (done) {
    var _xml = '<xml> <t_row> {d[i].brand} </t_row> '+
                 '<t_row> <td> {d[i].cars[weight,weight<3].wheel.name} </td> <td> {d[i].cars[weight+1,weight<3].wheel.name} </td> </t_row>'+
                 '<t_row> {d[i+1].brand} </t_row>'+
                 '<t_row> {d[i].brand} </t_row> '+
                 '<t_row> <td> {d[i].cars[weight,weight>2].wheel.name} </td> <td> {d[i].cars[weight+1,weight>2].wheel.name} </td> </t_row>'+
                 '<t_row> {d[i+1].brand} </t_row> </xml>';
    var _data = [
      {
        brand : 'Toyota',
        cars  : [
          { name : 'prius', autonomy : 7, weight : 1, wheel : { name : 'norauto' } },
          { name : 'yaris', autonomy : 2, weight : 3, wheel : { name : 'goodyear' } },
          { name : 'civic', autonomy : 0, weight : 2, wheel : { name : 'michelin' } },
          { name : 'auris', autonomy : 3, weight : 4, wheel : { name : 'continental' } }
        ]
      }
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml> <t_row> Toyota </t_row> '+
                                '<t_row> <td> norauto </td> <td> michelin </td>  </t_row>'+
                                '<t_row> Toyota </t_row> '+
                                '<t_row> <td> goodyear </td> <td> continental </td>  </t_row> </xml>');
      done();
    });
  });
  it('should accept conditionnal arrays without iterators', function (done) {
    var _xml = '<xml> <t_row> {d[id=2].brand} </t_row><t_row> {d[id=1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , id : 1},
      {brand : 'Tesla motors', id : 2},
      {brand : 'Toyota'      , id : 3}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Tesla motors </t_row><t_row> Lumeneo </t_row></xml>');
      done();
    });
  });
  it('should accept conditionnal arrays on string', function (done) {
    var _xml = '<xml> <t_row> {d[brand="Tesla"].brand} </t_row></xml>';
    var _data = [
      {brand : 'Toyota' , id : 1},
      {brand : 'Tesla'  , id : 2},
      {brand : 'Toyota' , id : 3}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Tesla </t_row></xml>');
      done();
    });
  });
  it('if two objects match with the filter, it should select the first occurence', function (done) {
    var _xml = '<xml> <t_row> {d[id=2].brand} </t_row><t_row> {d[id=1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , id : 1},
      {brand : 'Tesla motors', id : 2},
      {brand : 'Toyota'      , id : 2}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Tesla motors </t_row><t_row> Lumeneo </t_row></xml>');
      done();
    });
  });
  it('should accept conditions on the main iterators "i"', function (done) {
    var _xml = '<xml> <t_row> {d[i=2].brand} </t_row><t_row> {d[i=1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , id : 1},
      {brand : 'Tesla motors', id : 2},
      {brand : 'Toyota'      , id : 3}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Toyota </t_row><t_row> Tesla motors </t_row></xml>');
      done();
    });
  });
  it('should accept declared variable in xml', function (done) {
    var _xml = '{#myVar= i=2  }<xml> <t_row> {d[$myVar].brand} </t_row><t_row> {d[i=1].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , id : 1},
      {brand : 'Tesla motors', id : 2},
      {brand : 'Toyota'      , id : 3}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Toyota </t_row><t_row> Tesla motors </t_row></xml>');
      done();
    });
  });
  it('should not confuse two variables which begin with the same word', function (done) {
    var _xml = '{#myVar2 = i=2  }{#myVar = i=1  }<xml> <t_row> {d[$myVar2].brand} </t_row><t_row> {d[$myVar].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , id : 1},
      {brand : 'Tesla motors', id : 2},
      {brand : 'Toyota'      , id : 3}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Toyota </t_row><t_row> Tesla motors </t_row></xml>');
      done();
    });
  });
  it('should not confuse two parameters which begin with the same word', function (done) {
    var _xml = '{#myVar($id, $idEnd) = i>$id,i<$idEnd  }<xml> <t_row> {d[$myVar(1,3)].brand} </t_row><t_row> {d[$myVar(0,2)].brand} </t_row></xml>';
    var _data = [
      {brand : 'Lumeneo'     , id : 1},
      {brand : 'Tesla motors', id : 2},
      {brand : 'Toyota'      , id : 3}
    ];
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      helper.assert(_xmlBuilt, '<xml> <t_row> Toyota </t_row><t_row> Tesla motors </t_row></xml>');
      done();
    });
  });
  it('should be fast', function (done) {
    // generate data
    var _nbExecuted = 10;
    var _waitedResponse = _nbExecuted;
    var _nbCountries = 100;
    var _nbCities = 30;
    var _data = generateData(_nbCountries, _nbCities);
    var _xml =  '<xml>'
               +'  <tr><h1>{d[i].id} - {d[i].name}</h1>'
               +'    <td>{d[i].cities[i].id} - {d[i].cities[i].name}</td>'
               +'    <td>{d[i].cities[i+1].id} - {d[i].cities[i+1].name}</td>'
               +'  </tr>'
               +'  <tr><h1>{d[i+1].id} - {d[i+1].name}</h1>'
               +'    <td>{d[i+1].cities[i].id} - {d[i+1].cities[i].name}</td>'
               +'    <td>{d[i+1].cities[i+1].id} - {d[i+1].cities[i+1].name}</td>'
               +'  </tr>'
               +'</xml>';
    var _start = new Date();
    for (var i = 0; i < _nbExecuted; i++) {
      builder.buildXML(_xml, _data, function () {
        _waitedResponse--;
        if (_waitedResponse === 0) {
          theEnd();
        }
      });
    }
    function theEnd () {
      var _end = new Date();
      var _elapsed = (_end.getTime() - _start.getTime())/_nbExecuted; // time in milliseconds
      console.log('\n\n buildXML Time Elapsed : '+_elapsed + ' ms per call for '+_nbExecuted+' calls (usally around 20ms)\n\n\n');
      assert.equal((_elapsed < 50), true);
      done();
    }
  });
  it('should accept to increment two nested arrays in the same time. Thus, the nested array is flattened', function (done) {
    var _xml =
       '<xml>'
      +  '<tr>{d.cars[i].wheels[i].size  }</tr>'
      +  '<tr>{d.cars[i+1].wheels[i+1].size}</tr>'
      +'</xml>';
    var _data = {
      cars : [
        {wheels : [ {size : 'A'}, {size : 'B'}               ]},
        {wheels : [ {size : 'C'}, {size : 'D'},{size : 'E'} ]}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><tr>A</tr><tr>B</tr><tr>C</tr><tr>D</tr><tr>E</tr></xml>');
      done();
    });
  });
  it('should manage "holes" if we use the operatior "++" instead of "+1"', function (done) {
    var _xml =
       '<xml>'
      +  '<t_row><td>{d.cars[i].wheels[size].size  }</td><td>{d.cars[i].wheels[size++].size  }</td></t_row>'
      +  '<t_row><td>{d.cars[i+1].wheels[size].size}</td><td>{d.cars[i+1].wheels[size++].size}</td></t_row>'
      +'</xml>';
    var _data = {
      cars : [
        {wheels : [                {size : 'D'}, {size : 'E'}]},
        {wheels : [ {size : 'C'}, {size : 'D'}, {size : 'E'}]}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><t_row><td></td><td>D</td><td>E</td></t_row><t_row><td>C</td><td>D</td><td>E</td></t_row></xml>');
      done();
    });
  });
  it('should manage "holes"(++) and it should not crash if we use a nested object', function (done) {
    var _xml =
       '<xml>'
      +  '<t_row><td>{d.cars[i].wheels[size].obj.id  }</td><td>{d.cars[i].wheels[size++].obj.id  }</td></t_row>'
      +  '<t_row><td>{d.cars[i+1].wheels[size].obj.id}</td><td>{d.cars[i+1].wheels[size++].obj.id}</td></t_row>'
      +'</xml>';
    var _data = {
      cars : [
        {wheels : [                                {size : 'D', obj : {id : 2}}, {size : 'E', obj : {id : 3}} ]},
        {wheels : [ {size : 'C', obj : {id : 1}}, {size : 'D', obj : {id : 2}}, {size : 'E', obj : {id : 3}} ]}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><t_row><td></td><td>2</td><td>3</td></t_row><t_row><td>1</td><td>2</td><td>3</td></t_row></xml>');
      done();
    });
  });
  it('should work with conditions on nested arrays and with an object', function (done) {
    var _xml =
       '<xml>'
      +  '<t_row>{d.menus[meal=0, weekday=2].dishes[sort=2].obj.name}</t_row>'
      +  '<t_row>{d.menus[meal=0, weekday=1].dishes[sort=2].obj.name}</t_row>'
      +'</xml>';
    var _data = {
      menus : [
        {weekday : 1, meal : 0, dishes : [ {sort : 1, obj : {name : 'A'}}, {sort : 2, obj : {name : 'E'}}                                 ]},
        {weekday : 2, meal : 0, dishes : [ {sort : 1, obj : {name : 'B'}}, {sort : 2, obj : {name : 'F'}}                                 ]},
        {weekday : 1, meal : 1, dishes : [ {sort : 1, obj : {name : 'C'}}, {sort : 2, obj : {name : 'G'}},{sort : 3, obj : {name : 'I'}} ]},
        {weekday : 2, meal : 1, dishes : [ {sort : 1, obj : {name : 'D'}}, {sort : 2, obj : {name : 'H'}},{sort : 3, obj : {name : 'J'}} ]}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><t_row>F</t_row><t_row>E</t_row></xml>');
      done();
    });
  });
  it('shoud go up in hierarchy using two points ".."', function (done) {
    var _xml = '<xml><tr> {d.cars[i]..who} </tr><tr> {d.cars[i+1]..who} </tr></xml>';
    var _data = {
      who  : 'test',
      cars : [
        {brand : 'Lumeneo'},
        {brand : 'Tesla motors'},
        {brand : 'Toyota'}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><tr> test </tr><tr> test </tr><tr> test </tr></xml>');
      done();
    });
  });
  it('shoud go up in hierarchy using two points ".." and go down', function (done) {
    var _xml = '<xml><tr> {d.cars[i]..who.name.sex} </tr><tr> {d.cars[i+1]..who.name.sex} </tr></xml>';
    var _data = {
      who : {
        name : {
          sex : 'male'
        }
      },
      cars : [
        {brand : 'Lumeneo'},
        {brand : 'Tesla motors'},
        {brand : 'Toyota'}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><tr> male </tr><tr> male </tr><tr> male </tr></xml>');
      done();
    });
  });
  it('shoud go up in hierarchy using two points ".." and accept filters', function (done) {
    var _xml = '<xml><tr> {d.cars[i, brand="Lumeneo"]..who} </tr><tr> {d.cars[i+1]..who} </tr></xml>';
    var _data = {
      who  : 'test',
      cars : [
        {brand : 'Lumeneo'},
        {brand : 'Tesla motors'},
        {brand : 'Toyota'}
      ]
    };
    builder.buildXML(_xml, _data, function (err, _xmlBuilt) {
      assert.equal(_xmlBuilt, '<xml><tr> test </tr></xml>');
      done();
    });
  });
  /* it.skip('should not crash if the markes are not correct (see comment below)');*/
  /*
    [
      { "pos": 11586, "name": "d.fromDate:convert(YYYYMMDD,DD/MM/YYYY)" },
      { "pos": 12854, "name": "d[i].date" },
      { "pos": 13469, "name": "d[type=2,i].value:toFixed(2)" },
      { "pos": 13723,  "name": "d[i+1].date" }
    ]
  */
  /* it.skip('should not crash if the markers does not exist');*/
  /*
    [
      { "pos": 11586, "name": "d.fromDate:convert(YYYYMMDD,DD/MM/YYYY)" },
      { "pos": 12854, "name": "d[i].date" },
      { "pos": 13469, "name": "d[type=2,i].value:toFixed(2)" },
      { "pos": 13723,  "name": "d[i+1].date" }
    ]
  */
});


function generateData (nbCountries, nbCities) {
  var _data = [];
  for (var i = 0; i < nbCountries ; i++) {
    var _country = {
      id     : i,
      name   : 'country_'+i,
      cities : []
    };
    for (var j = 0; j < nbCities; j++) {
      var _city = {
        id   : (j*i),
        name : 'city_'+(j*i)
      };
      _country.cities.push(_city);
    }
    _data.push(_country);
  }
  return _data;
}
