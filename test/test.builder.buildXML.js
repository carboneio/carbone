var assert = require('assert');
var carbone = require('../lib/index');
var builder = require('../lib/builder');
var path  = require('path');
var fs = require('fs');
var helper = require('../lib/helper');

describe('builder.buildXML', function(){

  it('should work if the same array is repeated two times in the xml <tr>d[i].product</tr>    <tr>d[i].product</tr>');
  it.skip('should escape special characters > < & " \' even if a formatter is used (output of a formatter)');
  it('should return the xml if no data is passed', function(){
    var _xml = '<xml> </xml>';
    var _xmlBuilt = builder.buildXML(_xml);
    helper.assert(_xmlBuilt, '<xml> </xml>');
  });
  it('should replace a simple tag by the data', function(){
    var _xml = '<xml> {d.title} </xml>';
    var _data = {'title' : 'boo'};
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> boo </xml>');
  });
  it('should accept a second object which is accessible with the marker {c.}, c as "complement"', function(){
    var _xml = '<xml> {d.title} {c.date} </xml>';
    var _data = {'title' : 'boo'};
    var _complement = {'date' : 'today'};
    var _xmlBuilt = builder.buildXML(_xml, _data, _complement);
    helper.assert(_xmlBuilt, '<xml> boo today </xml>');
  });
  it('should replace null or undefined data by an empty string', function(){
    var _xml = '<xml> {d.title} </xml>';
    var _xmlBuilt = builder.buildXML(_xml, {'title' : null});
    helper.assert(_xmlBuilt, '<xml>  </xml>');
    _xmlBuilt = builder.buildXML(_xml, {'title' : undefined});
    helper.assert(_xmlBuilt, '<xml>  </xml>');
  });
  it('should escape special characters > < & for XML', function(){
    var _xml = '<xml> {d.title} </xml>';
    var _xmlBuilt = builder.buildXML(_xml, {'title' : '&'});
    helper.assert(_xmlBuilt, '<xml> &amp; </xml>');
    _xmlBuilt = builder.buildXML(_xml, {'title' : '<'});
    helper.assert(_xmlBuilt, '<xml> &lt; </xml>');
    _xmlBuilt = builder.buildXML(_xml, {'title' : '>'});
    helper.assert(_xmlBuilt, '<xml> &gt; </xml>');
   /* 
    Apparently,  Word and LibreOffice accept " and ' directly in XML.
    _xmlBuilt = builder.buildXML(_xml, {'title' : '\''});
    helper.assert(_xmlBuilt, '<xml> &apos; </xml>');
    _xmlBuilt = builder.buildXML(_xml, {'title' : '"'});
    helper.assert(_xmlBuilt, '<xml> &quot; </xml>');*/
    _xmlBuilt = builder.buildXML(_xml, {'title' : 'a & b c <table> <> & <'});
    helper.assert(_xmlBuilt, '<xml> a &amp; b c &lt;table&gt; &lt;&gt; &amp; &lt; </xml>');
  });
  it('should works with two nested objects', function(){
    var _xml = '<xml> {d.title} <br> {d.city.id} </xml>';
    var _data = {
      'title' : 'boo',
      'city' :{
        'id' : 5
      }
    };
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> boo <br> 5 </xml>');
  });
  it('should remove the tags if the data is not what you expect', function(){
    var _xml = '<xml> {d.title} <br> {d.city.id} </xml>';
    var _data = {
      'bullshit' : 'boo'
    };
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml>  <br>  </xml>');
  });
  it('should remove the tags part if the data is not provided', function(){
    var _xml = '<xml> {d.title} <br> {d.city.id} </xml>';
    var _data = {
      'title' : 'boo'
    };
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> boo <br>  </xml>');
  });
  it('should automatically repeat the xml if the root is an array of objects', function(){
    var _xml = '<xml> <t_row> {d[i].brand} </t_row><t_row> {d[i+1].brand} </t_row></xml>';
    var _data = [
      {'brand' : 'Lumeneo'},
      {'brand' : 'Tesla motors'},
      {'brand' : 'Toyota'}
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
  });
  it('should works even if there are some empty rows between the two repetition markers', function(){
    var _xml = '<xml> <t_row> {d[i].brand} </t_row> <t_row></t_row> <t_row> {d[i+1].brand} </t_row></xml>';
    var _data = [
      {'brand' : 'Lumeneo'},
      {'brand' : 'Tesla motors'}
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row> <t_row></t_row> <t_row> Tesla motors </t_row> <t_row></t_row> </xml>');
  });
  it('should handle array in an object', function(){
    var _xml = '<xml><t_row> {d.cars[i].brand} </t_row><t_row> {d.cars[i+1].brand} </t_row></xml>';
    var _data = {
      'cars':[
        {'brand' : 'Lumeneo'},
        {'brand' : 'Tesla motors'},
        {'brand' : 'Toyota'}
      ]
    };
    var _xmlBuilt = builder.buildXML(_xml, _data);
    assert.equal(_xmlBuilt, '<xml><t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
  });
  it('AAshould accept custom iterators and sort the data using this iterator', function(){
    var _xml = '<xml><t_row> {d.cars[sort].brand} </t_row><t_row> {d.cars[sort+1].brand} </t_row></xml>';
    var _data = {
      'cars':[
        {'brand' : 'Lumeneo'     , 'sort':3},
        {'brand' : 'Tesla motors', 'sort':1},
        {'brand' : 'Toyota'      , 'sort':2}
      ]
    };
    var _xmlBuilt = builder.buildXML(_xml, _data);
    assert.equal(_xmlBuilt, '<xml><t_row> Tesla motors </t_row><t_row> Toyota </t_row><t_row> Lumeneo </t_row></xml>');
  });
  it('should use keep the first element of the array if the custom iterator is constant (always equals 1)', function(){
    var _xml = '<xml><t_row> {d.cars[sort].brand} </t_row><t_row> {d.cars[sort+1].brand} </t_row></xml>';
    var _data = {
      'cars':[
        {'brand' : 'Lumeneo'     , 'sort':1},
        {'brand' : 'Tesla motors', 'sort':1},
        {'brand' : 'Toyota'      , 'sort':1}
      ]
    };
    var _xmlBuilt = builder.buildXML(_xml, _data);
    assert.equal(_xmlBuilt, '<xml><t_row> Tesla motors </t_row></xml>');
  });
  it('should accept two iterators', function(){
    var _xml = '<xml><t_row> {d.cars[sort,i].brand} </t_row><t_row> {d.cars[sort+1,i+1].brand} </t_row></xml>';
    var _data = {
      'cars':[
        {'brand' : 'Lumeneo'     , 'sort':1},
        {'brand' : 'Tesla motors', 'sort':2},
        {'brand' : 'Toyota'      , 'sort':1}
      ]
    };
    var _xmlBuilt = builder.buildXML(_xml, _data);
    assert.equal(_xmlBuilt, '<xml><t_row> Lumeneo </t_row><t_row> Toyota </t_row><t_row> Tesla motors </t_row></xml>');
  });
  it('should accept three iterators', function(){
    var _xml = '<xml><t_row> {d.cars[speed, sort,i].brand} </t_row><t_row> {d.cars[speed+1, sort+1, i+1].brand} </t_row></xml>';
    var _data = {
      'cars':[
        {'brand' : 'fourth', 'speed':'c', 'sort':1},
        {'brand' : 'fifth' , 'speed':'c', 'sort':1},
        {'brand' : 'first' , 'speed':'a', 'sort':2},
        {'brand' : 'third' , 'speed':'b', 'sort':2},
        {'brand' : 'second', 'speed':'b', 'sort':1}
      ]
    };
    var _xmlBuilt = builder.buildXML(_xml, _data);
    assert.equal(_xmlBuilt, '<xml><t_row> first </t_row><t_row> second </t_row><t_row> third </t_row><t_row> fourth </t_row><t_row> fifth </t_row></xml>');
  });
  it('should select only one element if the iterator is always null ???', function(){
    var _xml = '<xml><t_row> {d.cars[sort].brand} </t_row><t_row> {d.cars[sort+1].brand} </t_row></xml>';
    var _data = {
      'cars':[
        {'brand' : 'Lumeneo'     , 'sort':null},
        {'brand' : 'Tesla motors', 'sort':null},
        {'brand' : 'Toyota'      , 'sort':null}
      ]
    };
    var _xmlBuilt = builder.buildXML(_xml, _data);
    assert.equal(_xmlBuilt, '<xml><t_row> Tesla motors </t_row></xml>');
  });
  it.skip('should use the default order of the array if the custom iterator is undefined', function(){
    var _xml = '<xml><t_row> {d.cars[sort].brand} </t_row><t_row> {d.cars[sort+1].brand} </t_row></xml>';
    var _data = {
      'cars':[
        {'brand' : 'Lumeneo'     , 'sort':undefined},
        {'brand' : 'Tesla motors', 'sort':undefined},
        {'brand' : 'Toyota'      , 'sort':undefined}
      ]
    };
    var _xmlBuilt = builder.buildXML(_xml, _data);
    assert.equal(_xmlBuilt, '<xml><t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
  });
  it('should work if there is a whitespace between "cars" and "[" in some tags', function(){
    var _xml = '<xml><t_row> {d.cars[i].brand} </t_row><t_row> {d.cars [i+1].brand} </t_row></xml>';
    var _data = {
      'cars':[
        {'brand' : 'Lumeneo'},
        {'brand' : 'Tesla motors'},
        {'brand' : 'Toyota'}
      ]
    };
    var _xmlBuilt = builder.buildXML(_xml, _data);
    assert.equal(_xmlBuilt, '<xml><t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
  });
  it('should detect repetition even if there is only one self-closing tag between the two parts (with whitespaces)', function(){
    var _xml = '<xml><p><p><br/></p></p>{d[i].brand}  <br/>{d[i+1].brand}  <br/></xml>';
    var _data = [
      {'brand' : 'Lumeneo'},
      {'brand' : 'Tesla motors'}
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml><p><p><br/></p></p>Lumeneo  <br/>Tesla motors  <br/></xml>');
  });
  it.skip('should work even if there are only self-closing tags', function(){
    var _xml = '<xml> <br/> {d[i].brand} <br/> <br/><br/> <br/> {d[i+1].brand} <br/></xml>';
    var _data = [
      {'brand' : 'Lumeneo'},
      {'brand' : 'Tesla motors'}
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> <br/> Lumeneo <br/> <br/><br/> <br/> Tesla motors <br/> <br/><br/> </xml>');
  });
  it('should manage nested arrays', function(){
    var _xml = 
       '<xml>'
      +  '<t_row><td>{d.cars[i].wheels[i].size  }</td><td>{d.cars[i].wheels[i+1].size  }</td></t_row>'
      +  '<t_row><td>{d.cars[i+1].wheels[i].size}</td><td>{d.cars[i+1].wheels[i+1].size}</td></t_row>'
      +'</xml>';
    var _data = {
      'cars':[
        {'wheels': [ {'size': 'A'}, {'size': 'B'}               ]},
        {'wheels': [ {'size': 'C'}, {'size': 'D'},{'size': 'E'} ]}
      ]
    };
    var _xmlBuilt = builder.buildXML(_xml, _data);
    assert.equal(_xmlBuilt, '<xml><t_row><td>A</td><td>B</td></t_row><t_row><td>C</td><td>D</td><td>E</td></t_row></xml>');
  });
  it('should manage two adjacents arrays within an array. It should accept partial repetitions (only {d[i+1].site.label} is set)', function(){
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
      'site' : {'label':'site_A'},
      'cars' : [ {'size': 'A'}, {'size': 'B'}  ],
      'trucks' : [ {'size': 'X'} ]
    }];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    assert.equal(_xmlBuilt, '<xml><table><h1>site_A</h1><cell><t_row>A</t_row><t_row>B</t_row></cell><cell><t_row>X</t_row></cell></table></xml>');
  });
  it('should manage nested object with two adjacents arrays within an array. It should accept partial repetitions (only {d[i+1].site.label} is set)', function(){
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
      'site' : {'label':'site_A'},
      'cars' : [ {'size': 'A', 'spec':{'qty': 1}}, {'size': 'B', 'spec':{'qty': 2}}  ],
      'trucks' : [ {'size': 'X'} ]
    }];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    assert.equal(_xmlBuilt, '<xml><table><h1>site_A</h1><cell><t_row><td>A</td><td>1</td></t_row><t_row><td>B</td><td>2</td></t_row></cell><cell><t_row><td>X</td></t_row></cell></table></xml>');
  });
  it('1. should manage 3 levels of arrays with nested objects even if the xml tags are the same everywhere (td)', function(){
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
        'site' : {'label':'site_A'},
        'cars' : [ 
          { 
            'name': 'prius', 
            'autonomy': 7, 
            'spec': {'weight': 1},
            'wheels':[
              {'strengh':'s1', 'tire':{'brand':'mich'}}
            ]
          }, 
          { 
            'name': 'civic', 
            'autonomy': 0, 
            'spec': {'weight': 2},
            'wheels':[
              {'strengh':'s2', 'tire':{'brand':'mich'}}
            ]
          },
        ],
        'trucks' : [ {'name': 'scania'} ]
      },{
        'site' : {'label':'site_B'},
        'cars' : [ ],
        'trucks' : [ {'name': 'daf'}, {'name': 'hyundai'} ]
      }
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
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
  });
  it('should manage nested arrays with complex iterators', function(){
    var _xml = 
       '<xml>'
      +  '<t_row><td>{d.cars[driver.name].wheels[size].size  }</td><td>{d.cars[driver.name].wheels[size+1].size  }</td></t_row>'
      +  '<t_row><td>{d.cars[driver.name+1].wheels[size].size}</td><td>{d.cars[driver.name+1].wheels[size+1].size}</td></t_row>'
      +'</xml>';
    var _data = {
      'cars':[
        {
          'wheels': [ {'size': 'B'}, {'size': 'A'}                ],
          'driver': {'name' : 'david'}
        },
        {
          'wheels': [ {'size': 'D'}, {'size': 'C'}, {'size': 'E'} ],
          'driver': {'name' : 'bob'}
        }
      ]
    };
    var _xmlBuilt = builder.buildXML(_xml, _data);
    assert.equal(_xmlBuilt, '<xml><t_row><td>C</td><td>D</td><td>E</td></t_row><t_row><td>A</td><td>B</td></t_row></xml>');
  });
  it('should work with two adjacents arrays and some xml in between. It should work even if there are a lot of whitespaces ', function(){
    var _xml = 
       '<xml>'
      +  '<t_cars>   <td>{  d.cars[ i ].brand   } </td> <td>{   d.cars[i + 1 ].brand   } </td> </t_cars>'
      +  '<oo> hello </oo>'
      +  '<t_wheels> <td>{  d.wheels[ i ].size  } </td> <td>{   d.wheels[ i + 1].size  } </td> </t_wheels>'
      +'</xml>';
    var _data = {
      'cars'  : [ {'brand': 'Tesla'}, {'brand': 'Lumeneo'}, {'brand': 'Venturi'} ],
      'wheels': [ {'size': 'A'},      {'size': 'B'} ]
    };
    var _xmlBuilt = builder.buildXML(_xml, _data);
    assert.equal(_xmlBuilt, '<xml><t_cars>   <td>Tesla </td> <td>Lumeneo </td> <td>Venturi </td>  </t_cars><oo> hello </oo><t_wheels> <td>A </td> <td>B </td>  </t_wheels></xml>');
  });
  it('should accept condition "=" in arrays', function(){
    var _xml = '<xml> <t_row> {d[speed=100,i].brand} </t_row><t_row> {d[  speed =  100 ,  i+1].brand} </t_row></xml>';
    var _data = [
      {'brand' : 'Lumeneo'     , 'speed':100},
      {'brand' : 'Tesla motors', 'speed':200},
      {'brand' : 'Toyota'      , 'speed':100}
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Toyota </t_row></xml>');
  });
  it('should manage conditions with nested arrays', function(){
    var _xml = 
       '<xml>'
      +  '<t_row><td>{d.cars[speed>10, i].wheels[size>6, i].size  }</td><td>{d.cars[speed>10, i].wheels[size>6, i+1].size  }</td></t_row>'
      +  '<t_row><td>{d.cars[speed>10, i+1].wheels[size>6, i].size}</td><td>{d.cars[speed>10, i+1].wheels[size>6, i+1].size}</td></t_row>'
      +'</xml>';
    var _data = {
      'cars':[
        {'wheels': [ {'size': 5}, {'size': 10}              ], 'speed':5},
        {'wheels': [ {'size': 5}, {'size': 10},{'size': 20} ], 'speed':20}
      ]
    };
    var _xmlBuilt = builder.buildXML(_xml, _data);
    assert.equal(_xmlBuilt, '<xml><t_row><td>10</td><td>20</td></t_row></xml>');
  });
  it('should accept condition ">" in arrays', function(){
    var _xml = '<xml> <t_row> {d[speed>100,i].brand} </t_row><t_row> {d[  speed >  100 ,  i+1].brand} </t_row></xml>';
    var _data = [
      {'brand' : 'Lumeneo'     , 'speed':50},
      {'brand' : 'Tesla motors', 'speed':200},
      {'brand' : 'Toyota'      , 'speed':100}
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> <t_row> Tesla motors </t_row></xml>');
  });
  it('should accept condition encoded ">" in arrays', function(){
    var _xml = '<xml> <t_row> {d[speed&gt;100,i].brand} </t_row><t_row> {d[  speed &gt;  100 ,  i+1].brand} </t_row></xml>';
    var _data = [
      {'brand' : 'Lumeneo'     , 'speed':50},
      {'brand' : 'Tesla motors', 'speed':200},
      {'brand' : 'Toyota'      , 'speed':100}
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> <t_row> Tesla motors </t_row></xml>');
  });
  it('should accept condition "<" in arrays', function(){
    var _xml = '<xml> <t_row> {d[speed<200,i].brand} </t_row><t_row> {d[  speed <  200 ,  i+1].brand} </t_row></xml>';
    var _data = [
      {'brand' : 'Lumeneo'     , 'speed':150},
      {'brand' : 'Tesla motors', 'speed':200},
      {'brand' : 'Toyota'      , 'speed':100}
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Toyota </t_row></xml>');
  });
  it('should accept condition encoded "<" in arrays', function(){
    var _xml = '<xml> <t_row> {d[speed&lt;200,i].brand} </t_row><t_row> {d[  speed &lt;  200 ,  i+1].brand} </t_row></xml>';
    var _data = [
      {'brand' : 'Lumeneo'     , 'speed':150},
      {'brand' : 'Tesla motors', 'speed':200},
      {'brand' : 'Toyota'      , 'speed':100}
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Toyota </t_row></xml>');
  });
  it('should accept multiple conditions in arrays', function(){
    var _xml = '<xml> <t_row> {d[speed=100, high < 15, i].brand} </t_row><t_row> {d[speed=100, high < 15,i+1].brand} </t_row></xml>';
    var _data = [
      {'brand' : 'Lumeneo'     , 'speed':100, 'high':12},
      {'brand' : 'Tesla motors', 'speed':200, 'high':5},
      {'brand' : 'Toyota'      , 'speed':100, 'high':44}
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row></xml>');
  });
  it('should accept conditions in a nested object', function(){
    var _xml = '<xml> <t_row> {d[ speed . high > 13, i].brand} </t_row><t_row> {d[ speed.high > 13,i+1].brand} </t_row></xml>';
    var _data = [
      {'brand' : 'Lumeneo'     , 'speed':{'high':12, 'low':1}},
      {'brand' : 'Tesla motors', 'speed':{'high':5 , 'low':2 }},
      {'brand' : 'Toyota'      , 'speed':{'high':44, 'low':20}}
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> <t_row> Toyota </t_row></xml>');
  });
  it('should accept two conditions on the same object-attribute. It should accept extra whitespaces in the condition', function(){
    var _xml = '<xml> <t_row> {d[ speed . high > 8, s pe ed.h igh < 20, i].brand} </t_row><t_row> {d[ speed.high > 8, speed.high < 20, i+1].brand} </t_row></xml>';
    var _data = [
      {'brand' : 'Lumeneo'     , 'speed':{'high':12, 'low':1}},
      {'brand' : 'Tesla motors', 'speed':{'high':5 , 'low':2 }},
      {'brand' : 'Toyota'      , 'speed':{'high':44, 'low':20}}
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row></xml>');
  });
  it.skip('should accept than the conditions is repeated multiples times (should not jave a variable declared two times in the builder)', function(){
    //TODO
    var _xml = '<xml> <t_row> {d[ speed . high > 8, s pe ed.h igh < 20, i].brand} </t_row><t_row> {d[ speed.high > 8, speed.high < 20, i+1].brand} </t_row></xml>';
    var _data = [
      {'brand' : 'Lumeneo'     , 'speed':{'high':12, 'low':1}},
      {'brand' : 'Tesla motors', 'speed':{'high':5 , 'low':2 }},
      {'brand' : 'Toyota'      , 'speed':{'high':44, 'low':20}}
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row></xml>');
  });
  it('AAshould work if the same array is repeated two times in the xml', function(){
    var _xml = '<xml> <t_row> {d[i].brand} </t_row><t_row> {d[i+1].brand} </t_row><t_row> {d[i].brand} </t_row><t_row> {d[i+1].brand} </t_row></xml>';
    var _data = [
      {'brand' : 'Lumeneo'},
      {'brand' : 'Tesla motors'},
      {'brand' : 'Toyota'}
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> <t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row><t_row> Lumeneo </t_row><t_row> Tesla motors </t_row><t_row> Toyota </t_row></xml>');
  });
  it('should work if the same array is repeated two times in the xml and there are condition is in a sub array', function(){
    var _xml = '<xml> <t_row> {d[i].brand} </t_row> '+ 
                 '<t_row> <td> {d[i].cars[weight,weight<3].wheel.name} </td> <td> {d[i].cars[weight+1,weight<3].wheel.name} </td> </t_row>'+
                 '<t_row> {d[i+1].brand} </t_row>'+
                 '<t_row> {d[i].brand} </t_row> '+ 
                 '<t_row> <td> {d[i].cars[weight,weight>2].wheel.name} </td> <td> {d[i].cars[weight+1,weight>2].wheel.name} </td> </t_row>'+
                 '<t_row> {d[i+1].brand} </t_row> </xml>';
    var _data = [
      {
        'brand' : 'Toyota',
        'cars' : [ 
          { 'name': 'prius', 'autonomy': 7, 'weight': 1, 'wheel' : { 'name' : 'norauto' } },
          { 'name': 'yaris', 'autonomy': 2, 'weight': 3, 'wheel' : { 'name' : 'goodyear' } },
          { 'name': 'civic', 'autonomy': 0, 'weight': 2, 'wheel' : { 'name' : 'michelin' } },
          { 'name': 'auris', 'autonomy': 3, 'weight': 4, 'wheel' : { 'name' : 'continental' } }
        ]
      }
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    assert.equal(_xmlBuilt, '<xml> <t_row> Toyota </t_row> '+
                              '<t_row> <td> norauto </td> <td> michelin </td>  </t_row>'+
                              '<t_row> Toyota </t_row> '+
                              '<t_row> <td> goodyear </td> <td> continental </td>  </t_row> </xml>');
  });
  it('should accept conditionnal arrays without iterators', function(){
    var _xml = '<xml> <t_row> {d[id=2].brand} </t_row><t_row> {d[id=1].brand} </t_row></xml>';
    var _data = [
      {'brand' : 'Lumeneo'     , 'id':1},
      {'brand' : 'Tesla motors', 'id':2},
      {'brand' : 'Toyota'      , 'id':3}
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> <t_row> Tesla motors </t_row><t_row> Lumeneo </t_row></xml>');
  });
  it('should accept conditions on the main iterators "i"', function(){
    var _xml = '<xml> <t_row> {d[i=2].brand} </t_row><t_row> {d[i=1].brand} </t_row></xml>';
    var _data = [
      {'brand' : 'Lumeneo'     , 'id':1},
      {'brand' : 'Tesla motors', 'id':2},
      {'brand' : 'Toyota'      , 'id':3}
    ];
    var _xmlBuilt = builder.buildXML(_xml, _data);
    helper.assert(_xmlBuilt, '<xml> <t_row> Toyota </t_row><t_row> Tesla motors </t_row></xml>');
  });
  /*it.skip('should not crash if the markes are not correct (see comment below)');*/
  /*
    [
      { "pos": 11586, "name": "d.fromDate:convert(YYYYMMDD,DD/MM/YYYY)" },
      { "pos": 12854, "name": "d[i].date" },
      { "pos": 13469, "name": "d[type=2,i].value:toFixed(2)" },
      { "pos": 13723,  "name": "d[i+1].date" }
    ]
  */

});


