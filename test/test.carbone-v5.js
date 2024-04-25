const assert = require('assert');
const carbone = require('../lib/index');
const helper = require('../lib/helper');

describe('Carbone v5', function () {

  describe('renderXML v5 special case with new algorithm', function () {

    it('should accept a loop inside an XML tag and weird condition, and it should not break XML', function (done) {
      var _xml = ''
        + '<body>'
        + '  <w1>'
        + '    <t1>{d.tool:ifEM():hideBegin}</t1>'
        + '  </w1>'
        + '  <w2>'
        + '    <r1>'
        + '      <t2>{d.tool[i].id}</t2>'
        + '    </r1>'
        + '  </w2>'
        + '  <w3>'
        + '    <r2>'
        + '      <t3>{d.tool[i].elements[i].id} -</t3>'
        + '    </r2>'
        + '  </w3>'
        + '  <w4>'
        + '    <r3>'
        + '      <t4>{d.tool[i].elements[i+1].id}{d.tool[i+1].id}</t4>' // loop on same level
        + '    </r3>'
        + '    <r4>'
        + '      <t5>{d.tool:hideEnd()}</t5>'
        + '    </r4>'
        + '  </w4>'
        + '</body>'
      ;
      carbone.renderXML(_xml, {}, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        helper.assert(_xmlBuilt, '<body>  <w1>    </w1></body>');
        const _data = {
          tool : [{
            id       : 10,
            elements : [{
              id : 30
            }]
          }]
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          helper.assert(err+'', 'null');
          helper.assert(_xmlBuilt, '<body>  <w1>    <t1></t1>  </w1>  <w2>    <r1>      <t2>10</t2>    </r1>  </w2>  <w3>    <r2>      <t3>30 -</t3>    </r2>  </w3>  </body>');
          done();
        });
      });
    });
    it('should accept filter on objects', function (done) {
      var _xml = '<body> {d.tool[.att = toto].val} </body>';
      var _data = {
        tool : {
          bibi : 2,
          toto : 3,
          titi : 4
        }
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        helper.assert(_xmlBuilt, '<body> 3 </body>');
        done();
      });
    });

    it('should accept loop inside an XML tag', function (done) {
      var _xml = '<body>  <p1>{d.tool[i].id} | {d.tool[i+1].id}</p1>  <p2></p2></body>';
      carbone.renderXML(_xml, {}, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        helper.assert(_xmlBuilt, '<body>  <p1></p1>  <p2></p2></body>');
        carbone.renderXML(_xml, { tool : [{id : 1}, {id : 2}] }, function (err, _xmlBuilt) {
          helper.assert(err+'', 'null');
          helper.assert(_xmlBuilt, '<body>  <p1>1 | 2 | </p1>  <p2></p2></body>');
          done();
        });
      });
    });
    it('should accept loop inside an XML tag attribute', function (done) {
      var _xml = '<body>  <p1 att="{d.tool[i].id}"></p1> RR <p2 att="{d.tool[i+1].id}"></p2></body>';
      carbone.renderXML(_xml, {}, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        helper.assert(_xmlBuilt, '<body>  </body>');
        carbone.renderXML(_xml, { tool : [{id : 1}, {id : 2}] }, function (err, _xmlBuilt) {
          helper.assert(err+'', 'null');
          helper.assert(_xmlBuilt, '<body>  <p1 att="1"></p1> RR <p1 att="2"></p1> RR </body>');
          done();
        });
      });
    });
    it('should accept loop inside an XML tag attribute and i+1 outside', function (done) {
      var _xml = '<body>  <p1 att="{d.tool[i].id}"></p1> RR <p2 att="">{d.tool[i+1].id}</p2></body>';
      carbone.renderXML(_xml, {}, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        helper.assert(_xmlBuilt, '<body>  </body>');
        carbone.renderXML(_xml, { tool : [{id : 1}, {id : 2}] }, function (err, _xmlBuilt) {
          helper.assert(err+'', 'null');
          helper.assert(_xmlBuilt, '<body>  <p1 att="1"></p1> RR <p1 att="2"></p1> RR </body>');
          done();
        });
      });
    });
    it('should accept loop with at the end of parent object', function (done) {
      var _xml = '<div><p></p><if>a{d.tool[i].id}a</if><if>bb</if><br/>{d.tool[i+1].id}</div>';
      carbone.renderXML(_xml, {}, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        helper.assert(_xmlBuilt, '<div><p></p></div>');
        carbone.renderXML(_xml, { tool : [{id : 1}, {id : 2}] }, function (err, _xmlBuilt) {
          helper.assert(err+'', 'null');
          helper.assert(_xmlBuilt, '<div><p></p><if>a1a</if><if>bb</if><br/><if>a2a</if><if>bb</if><br/></div>');
          done();
        });
      });
    });

    it('should accept a loop inside an XML tag and weird condition, and it should not break XML', function (done) {
      var _xml = ''
        + '<body>'
        +   '<p1>'
        +     '<w1>'
        +       '<t1>{d.tool:ifEM:hideBegin} </t1>'
        +     '</w1>'
        +     '<w2>'
        +       '<t2>text:</t2>'
        +     '</w2>'
        +     '<w3>'
        +       '<rPr1>'
        +         '<w:szCs/>'
        +       '</rPr1>'
        +       '<t3>{d.tool[i].id} | {d.tool[i+1].id}{d.tool:hideEnd()}</t3>'
        +     '</w3>'
        +   '</p1>'
        +   '<p2>'
        +     '<r1>'
        +       '<t4></t4>'
        +     '</r1>'
        +   '</p2>'
        + '</body>'
      ;
      carbone.renderXML(_xml, {}, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        helper.assert(_xmlBuilt, '<body><p1></p1><p2><r1><t4></t4></r1></p2></body>');
        done();
      });
    });
    it('should accept a loop inside an XML tag and weird condition, and it should not break XML (other use case)', function (done) {
      var _xml = (expected) => {
        return ''
          + '<body>'
          + '  <p1>'
          + '    <w3>'
          + (expected === false ?
            '      <t3>{d.tool[i].id} | {d.tool[i+1].id}</t3>' :
            '      <t3></t3>')
          + '    </w3>'
          + '  </p1>'
          + '  <p2>'
          + '    <r1>'
          + '      <t4></t4>'
          + '    </r1>'
          + '  </p2>'
          + '</body>';
      };
      carbone.renderXML(_xml(false), {}, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        helper.assert(_xmlBuilt, _xml(true));
        done();
      });
    });
    it('should not break XML if the loop is not correctly build inside XML', function (done) {
      var _xml = ''
        + '<body>'
        + '  <p>'
        + '    {d.tab[i].id}'
        + '    <t>{d.tab[i+1]}</t>'
        + '  </p>'
        + '</body>'
      ;
      var _data = {
        tab : [
          { id : 1 },
          { id : 2 }
        ]
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        helper.assert(_xmlBuilt, ''
          + '<body>'
          + '  <p>'
          + '    1'
          + '    2'
          + '    '
          + '  </p>'
          + '</body>'
        );
        done();
      });
    });
    it('should not break XML if there is a condition around i+1 part', function (done) {
      const _xml = ''
        + '<t>'
        + ' <c>{d.val:ifEM:hideBegin}</c>'
        + ' <tab>'
        + '  <p>{d.arr[i].a}</p>'
        + '  <c>{d.arr:ifEM:hideBegin}</c>'
        + '  <p>{d.arr[i+1].a}</p>'
        + '  <c>{d.arr:hideEnd}</c>'
        + ' </tab>'
        + ' <c>{d.val:ifEM:hideEnd}</c>'
        + '</t>';
      var _data = {
        arr : []
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(err+'', 'null');
        assert.equal(_xmlBuilt, '<t> </t>');

        _data.val = 'a';
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<t> <c></c> <tab>   </tab> <c></c></t>');

          _data.arr = [{ a : 1}, { a : 2}];
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<t> <c></c> <tab>  <p>1</p>  <p>2</p>   </tab> <c></c></t>');
            done();
          });
        });
      });
    });
    it('should not break XML or crash if there is no XML at the end of a loop with a condition on i+1 part', function (done) {
      const _xml = ''
        + '<p>{d.arr[i].a}</p>'
        + '{d.val:ifEM:hideBegin}'
        + '{d.arr[i+1].a}'
        + '{d.val:hideEnd}';
      var _data = {
        arr : []
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(err+'', 'null');
        assert.equal(_xmlBuilt, '');

        _data.val = 'a';
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '');

          _data.arr = [{ a : 1}, { a : 2}];
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<p>1</p><p>2</p>');
            done();
          });
        });
      });
    });
    it('should not break XML or crash if there are two loops and no XML at the end', function (done) {
      const _xml = ''
        + '<p>{d.arr[i].sub[i].a}</p>'
        + '{d.arr[i+1].sub[i+1].a}';
      var _data = {
        arr : []
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(err+'', 'null');
        assert.equal(_xmlBuilt, '');
        _data.arr = [{ sub : [{ a : 1}, { a : 2}] }, { sub : [{ a : 3}] }];
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<p>1</p><p>2</p><p>3</p>');
          done();
        });
      });
    });
    it('should not break XML or crash if there are two loops, withour XML and a condition', function (done) {
      const _xmls = [
        '{d.val:ifEM:hideBegin}{d.arr[i].sub[i].a}{d.arr[i+1].sub[i+1].a}{d.val:hideEnd}',
        '{d.val:ifEM:hideBegin}{d.arr[i].sub[i].a}{d.val:hideEnd}{d.arr[i+1].sub[i+1].a}',
        '{d.val:ifEM:hideBegin}{d.val:hideEnd}{d.arr[i].sub[i].a}{d.arr[i+1].sub[i+1].a}',
        '{d.arr[i].sub[i].a}{d.val:ifEM:hideBegin}{d.arr[i+1].sub[i+1].a}{d.val:hideEnd}'
      ];
      _xmls.forEach((xml, i) => {
        let _data = {
          arr : [],
          val : 'a'
        };
        carbone.renderXML(xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '');
          let _data = {
            arr : [{ sub : [{ a : 1}, { a : 2}] }, { sub : [{ a : 3}] }],
            val : 'a'
          };
          carbone.renderXML(xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '123');
            if (i === _xmls.length - 1) {
              done();
            }
          });
        });
      });
    });
    it('should not break XML if there is the same condition around i and i+1 part', function (done) {
      const _xml = ''
        + '<t>'
        + ' <c>{d.val:ifEM:hideBegin}</c>'
        + ' <tab>'
        + '  <c>{d.val:ifEM:hideBegin}</c>'
        + '  <p>{d.arr[i].a}</p>'
        + '  <c>{d.val:hideEnd}</c>'
        + '  <c>{d.val:ifEM:hideBegin}</c>'
        + '  <p>{d.arr[i+1].a}</p>'
        + '  <c>{d.val:hideEnd}</c>'
        + ' </tab>'
        + ' <c>{d.val:ifEM:hideEnd}</c>'
        + '</t>';
      var _data = {
        arr : []
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(err+'', 'null');
        assert.equal(_xmlBuilt, '<t> </t>');

        _data.val = 'a';
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<t> <c></c> <tab>   </tab> <c></c></t>');

          _data.arr = [{ a : 1}, { a : 2}];
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<t> <c></c> <tab>  <c></c>  <p>1</p>  <c></c>  <c></c>  <p>2</p>  <c></c>   </tab> <c></c></t>');
            done();
          });
        });
      });
    });
    it('should not break XML if the loop is not correctly built', function (done) {
      const _xml = ''
        + '<t>'
        + '  <c>{d.other:ifEM():hideBegin}</c>'
        + '  <tr>'
        + '    <c>{d.val:ifLT(2):hideBegin}</c>'
        + '    <p>{d.arr[i].a} </p>'
        + '    <c>{d.val:hideEnd}</c>'
        + '    <p>{d.arr[i+1]}</p>'
        + '  </tr>'
        + '  <c>{d.other:hideEnd}</c>'
        + '</t>';
      var _data = {
        arr : [],
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(err+'', 'null');
        assert.equal(_xmlBuilt, '<t>  </t>');
        done();
      });
    });
    it('should not break XML if the loop is not correctly built', function (done) {
      const _xml = ''
        + '<t>'
        + '  <c>{d.other:ifEM():hideBegin}</c>'
        + '  <tr>'
        + '    <c>{d.val:ifLT(2):hideBegin}</c>'
        + '    <p>{d.arr[i].a} </p>'
        + '    <c>{d.val:hideEnd}</c>'
        + '    <p>{d.arr[i+1]}</p>'
        + '  </tr>'
        + '  <c>{d.other:hideEnd}</c>'
        + '</t>';
      var _data = {
        arr : [],
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(err+'', 'null');
        assert.equal(_xmlBuilt, '<t>  </t>');
        done();
      });
    });
    it('should not break XML if the loop is wrap by a condition on i and i+1', function (done) {
      const _xml = ''
        + '<t>'
        + '  <tr>'
        + '    <c>{d.val:ifEQ(2):showBegin}</c>'
        + '    <p>{d.arr[i].a}</p>'
        + '    <c>{d.val:showEnd}</c>'
        + '    <c>{d.val:ifEQ(2):showBegin}</c>'
        + '    <p>{d.arr[i+1]}</p>'
        + '    <c>{d.val:showEnd}</c>'
        + '  </tr>'
        + '</t>';
      var _data = {
        arr : [],
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(err+'', 'null');
        assert.equal(_xmlBuilt, '<t>  <tr>      </tr></t>');

        _data.val = 2;
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<t>  <tr>      </tr></t>');

          _data.arr = [{a : '30'}];
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<t>  <tr>    <c></c>    <p>30</p>    <c></c>      </tr></t>');
            done();
          });
        });
      });
    });
    it('should not break XML if the loop is not correctly built', function (done) {
      const _xml = ''
        + '<t>'
        + '  <c>a{d.other:ifEM():hideBegin}</c>'
        + '  <tr>'
        + '    <y>{d.val:ifLT(2):hideBegin}</y>'
        + '    <p>{d.arr[i].a} </p>'
        + '    <z>{d.val:hideEnd}</z>'
        + '    <p>{d.arr[i+1]}</p>'
        + '  </tr>'
        + '  <u>{d.other:hideEnd}</u>'
        + '</t>';
      const _data = {
        arr : [],
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(err+'', 'null');
        assert.equal(_xmlBuilt, '<t>  <c>a</c></t>');
        const _data = {
          arr   : [{a : 2}, {a : 3}],
          other : 'dd'
        };
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<t>  <c>a</c>  <tr>    <y></y>    <p>2 </p>    <z></z>    <y></y>    <p>3 </p>    <z></z>      </tr>  <u></u></t>');
          done();
        });
      });
    });
    it('should not break XML if the loop is not correctly built', function (done) {
      const _xml = ''
        + '<t>'
        + '    <a>{d.other:ifEM:hideBegin}{d.id}</a><tr>'
        + '    <p>{d.arr[i].a} </p>'
        + '    <c>{d.other:hideEnd}</c>'
        + '    <p>{d.arr[i+1]}</p>'
        + '  </tr>'
        + '</t>';
      var _data = {
        id    : 20,
        arr   : [{a : 1}],
        other : ''
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(err+'', 'null');
        assert.equal(_xmlBuilt, '<t>    <tr>      </tr></t>');
        _data.other = 'b';
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<t>    <a>20</a><tr>    <p>1 </p>    <c></c>      </tr></t>');
          done();
        });
      });
    });
    it('should work even without XML', function (done) {
      const _xml = ''
        + '{d.other:ifEM:hideBegin}{d.id}{d.arr[i].a}{d.other:hideEnd} '
        + '{d.arr[i+1]}';
      var _data = {
        id    : 20,
        arr   : [{a : 1}],
        other : ''
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(err+'', 'null');
        assert.equal(_xmlBuilt, ' ');

        _data.arr = [{ a : 1 }];
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, ' ');

          _data.arr = [{ a : 1 }, { a : 2 }];
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '  ');

            _data.other = 'bla';
            _data.arr = [];
            carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
              assert.equal(err+'', 'null');
              assert.equal(_xmlBuilt, '');
              _data.other = 'bla';
              _data.arr = [{ a : 1 }];
              carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
                assert.equal(err+'', 'null');
                assert.equal(_xmlBuilt, '201 ');

                _data.other = 'bla';
                _data.arr = [{ a : 1 }, { a : 2 }];
                carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
                  assert.equal(err+'', 'null');
                  assert.equal(_xmlBuilt, '201 202 ');
                  done();
                });
              });
            });
          });
        });
      });
    });
    it('should work even without XML and without condition', function (done) {
      const _xml = ''
        + '{d.id}{d.arr[i].a} '
        + '{d.arr[i+1]}';
      var _data = {
        id  : 20,
        arr : []
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(err+'', 'null');
        assert.equal(_xmlBuilt, '20');

        _data.arr = [{ a : 1 }];
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '201 ');

          _data.arr = [{ a : 1 }, { a : 2 }];
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '201 2 ');
            done();
          });
        });
      });
    });
    it('should accept condition inside XML tags', function (done) {
      const _xml = '<xml>'
        + '<p image="{d.id:ifEQ(20):showBegin} blabl {d.id:ifEQ(20):showEnd}"> '
        + '</p>'
        + '</xml>';
      const _data = {
        id : 20,
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(err+'', 'null');
        assert.equal(_xmlBuilt, '<xml><p image=" blabl "> </p></xml>');

        _data.id = 10;
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<xml><p image=""> </p></xml>');

          done();
        });
      });
    });
    it('should not break XML if the loop is not correctly built with a IF block overlaps', function (done) {
      const _xml = ''
        + '<t>'
        + '    {d.other:ifEM:hideBegin}{d.id}<tr>'
        + '    <p>{d.arr[i].a} </p>'
        + '    <c>{d.other:hideEnd}</c>'
        + '    <p>{d.arr[i+1]}</p>' // the space before i+1 is outside of the condition
        + '  </tr>'
        + '</t>';
      var _data = {
        id    : 20,
        arr   : [],
        other : ''
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(err+'', 'null');
        assert.equal(_xmlBuilt, '<t>    <tr>  </tr></t>');

        _data.arr = [{ a : 1 }];
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<t>    <tr>      </tr></t>');

          _data.arr = [{ a : 1 }, { a : 2 }];
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<t>    <tr>          </tr></t>');

            _data.other = 'bla';
            _data.arr = [];
            carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
              assert.equal(err+'', 'null');
              assert.equal(_xmlBuilt, '<t>    20<tr>  </tr></t>');
              _data.other = 'bla';
              _data.arr = [{ a : 1 }];
              carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
                assert.equal(err+'', 'null');
                assert.equal(_xmlBuilt, '<t>    20<tr>    <p>1 </p>    <c></c>      </tr></t>');

                _data.other = 'bla';
                _data.arr = [{ a : 1 }, { a : 2 }];
                carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
                  assert.equal(err+'', 'null');
                  assert.equal(_xmlBuilt, '<t>    20<tr>    <p>1 </p>    <c></c>        <p>2 </p>    <c></c>      </tr></t>');
                  done();
                });
              });
            });
          });
        });
      });
    });
    it('should not break XML if the loop is not correctly built with a IF block overlaps. Same as before withouf whitespaces', function (done) {
      const _xml = ''
        + '<t>'
        + '{d.other:ifEM:hideBegin}{d.id}<tr>'
        + '<p>{d.arr[i].a} </p>'
        + '<c>{d.other:hideEnd}</c>'
        + '<p>{d.arr[i+1]}</p>' // the space before i+1 is outside of the condition
        + '</tr>'
        + '</t>';
      var _data = {
        id    : 20,
        arr   : [],
        other : ''
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(err+'', 'null');
        assert.equal(_xmlBuilt, '<t><tr></tr></t>');

        _data.arr = [{ a : 1 }];
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<t><tr></tr></t>');

          _data.arr = [{ a : 1 }, { a : 2 }];
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<t><tr></tr></t>');

            _data.other = 'bla';
            _data.arr = [];
            carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
              assert.equal(err+'', 'null');
              assert.equal(_xmlBuilt, '<t>20<tr></tr></t>');
              _data.other = 'bla';
              _data.arr = [{ a : 1 }];
              carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
                assert.equal(err+'', 'null');
                assert.equal(_xmlBuilt, '<t>20<tr><p>1 </p><c></c></tr></t>');

                _data.other = 'bla';
                _data.arr = [{ a : 1 }, { a : 2 }];
                carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
                  assert.equal(err+'', 'null');
                  assert.equal(_xmlBuilt, '<t>20<tr><p>1 </p><c></c><p>2 </p><c></c></tr></t>');
                  done();
                });
              });
            });
          });
        });
      });
    });
    it('should not break XML if the loop is not correctly built with a IF block overlaps (end is outside, begin inside the loop)', function (done) {
      const _xml = ''
        + '<t>'
        + '  <tr>'
        + '    <p>{d.other:ifEM:hideBegin}{d.arr[i].a}{d.id}</p>'
        + '    <p>{d.arr[i+1]}</p>'
        + '    {d.other:hideEnd}'
        + '  </tr>'
        + '</t>';
      var _data = {
        id    : 20,
        arr   : [],
        other : ''
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(err+'', 'null');
        assert.equal(_xmlBuilt, '<t>  <tr>      </tr></t>');

        _data.arr = [{ a : 1 }];
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<t>  <tr>      </tr></t>');

          _data.arr = [{ a : 1 }, { a : 2 }];
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<t>  <tr>      </tr></t>');

            _data.other = 'bla';
            _data.arr = [];
            carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
              assert.equal(err+'', 'null');
              assert.equal(_xmlBuilt, '<t>  <tr>          </tr></t>');
              _data.other = 'bla';
              _data.arr = [{ a : 1 }];
              carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
                assert.equal(err+'', 'null');
                assert.equal(_xmlBuilt, '<t>  <tr>    <p>120</p>          </tr></t>');

                _data.other = 'bla';
                _data.arr = [{ a : 1 }, { a : 2 }];
                carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
                  assert.equal(err+'', 'null');
                  assert.equal(_xmlBuilt, '<t>  <tr>    <p>120</p>    <p>220</p>          </tr></t>');
                  done();
                });
              });
            });
          });
        });
      });
    });
    it('should not break XML if the loop is not correctly built with a IF block overlaps (end is outside, begin inside the loop, no whitespace)', function (done) {
      const _xml = ''
        + '<t>'
        + '<tr>'
        + '<p>{d.other:ifEM:hideBegin}{d.arr[i].a}{d.id}</p>'
        + '<p>{d.arr[i+1]}</p>'
        + '{d.other:hideEnd}'
        + '</tr>'
        + '</t>';
      var _data = {
        id    : 20,
        arr   : [],
        other : ''
      };
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        assert.equal(err+'', 'null');
        assert.equal(_xmlBuilt, '<t><tr></tr></t>');

        _data.arr = [{ a : 1 }];
        carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
          assert.equal(err+'', 'null');
          assert.equal(_xmlBuilt, '<t><tr></tr></t>');

          _data.arr = [{ a : 1 }, { a : 2 }];
          carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
            assert.equal(err+'', 'null');
            assert.equal(_xmlBuilt, '<t><tr></tr></t>');

            _data.other = 'bla';
            _data.arr = [];
            carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
              assert.equal(err+'', 'null');
              assert.equal(_xmlBuilt, '<t><tr></tr></t>');
              _data.other = 'bla';
              _data.arr = [{ a : 1 }];
              carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
                assert.equal(err+'', 'null');
                assert.equal(_xmlBuilt, '<t><tr><p>120</p></tr></t>');

                _data.other = 'bla';
                _data.arr = [{ a : 1 }, { a : 2 }];
                carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
                  assert.equal(err+'', 'null');
                  assert.equal(_xmlBuilt, '<t><tr><p>120</p><p>220</p></tr></t>');
                  done();
                });
              });
            });
          });
        });
      });
    });
    it('should accept two loops, with cumCount (is it a v5 test?)', function (done) {
      var _xml = ''
        + '<d>'
        + '  <l>'
        + '    <ref>{c.id:cumCount}</ref>'
        + '    <acc id="{c.id:cumCount}">{d[i].groups[i].label}</acc>'
        + '  </l>'
        + '  <l>'
        + '    {d[i+1].groups[i+1]}'
        + '  </l>'
        + '  <l>'
        + '    <acc id="{c.id:cumCount}">{d[i].groups[i].label}</acc>'
        + '    <ref>{c.id:cumCount}</ref>'
        + '  </l>'
        + '  <l>'
        + '    {d[i+1].groups[i+1]}'
        + '  </l>'
        + '</d>'
      ;
      var _data = [
        {
          groups : [ { label : 10 }, {label : 11 } ],
          direct : [ { sub : { id : 'aa' }}, { sub : { id : 'cc' }} ]
        },
        {
          groups : [ { label : 20 }, { label : 30 } ],
          direct : [ { sub : { id : 'zz' }} ]
        }
      ];
      carbone.renderXML(_xml, _data, function (err, _xmlBuilt) {
        helper.assert(err+'', 'null');
        helper.assert(_xmlBuilt, ''
          + '<d>'
          + '  <l>'
          + '    <ref>1</ref>'
          + '    <acc id="1">10</acc>'
          + '  </l>'
          + '  <l>'
          + '    <ref>2</ref>'
          + '    <acc id="2">11</acc>'
          + '  </l>'
          + '  <l>'
          + '    <ref>3</ref>'
          + '    <acc id="3">20</acc>'
          + '  </l>'
          + '  <l>'
          + '    <ref>4</ref>'
          + '    <acc id="4">30</acc>'
          + '  </l>  '
          + '  <l>'
          + '    <acc id="1">10</acc>'
          + '    <ref>1</ref>'
          + '  </l>'
          + '  <l>'
          + '    <acc id="2">11</acc>'
          + '    <ref>2</ref>'
          + '  </l>'
          + '  <l>'
          + '    <acc id="3">20</acc>'
          + '    <ref>3</ref>'
          + '  </l>'
          + '  <l>'
          + '    <acc id="4">30</acc>'
          + '    <ref>4</ref>'
          + '  </l>  '
          + '</d>'
        );
        done();
      });
    });
  });

});

