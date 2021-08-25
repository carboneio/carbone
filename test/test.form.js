const form = require("../lib/form");
const formFormatter = require('../formatters/form');
const helperTest = require("./helper");
const carbone = require("../lib/index");

describe("FORM - ODT files", function () {
  describe("Checkbox préprocessing", function () {
    it('should do nothing if the document does not contain a form', function () {
      const _expectedXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="gr1" style:family="graphic"><style:graphic-properties draw:textarea-vertical-align="middle" style:wrap="run-through" style:number-wrapped-paragraphs="no-limit" style:vertical-pos="from-top" style:horizontal-pos="from-left" style:horizontal-rel="paragraph"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="Standard"><text:s text:c="5"/><draw:control text:anchor-type="as-char" svg:y="-0.379cm" draw:z-index="0" draw:name="Shape1" draw:style-name="gr1" draw:text-style-name="P2" svg:width="3.111cm" svg:height="1.08cm" draw:control="control1"/></text:p></office:text></office:body></office:document-content>';

      let _template = {
        files : [
          {
            name : 'content.xml',
            data : _expectedXML
          }
        ]
      };
      form.preProcessODT(_template);
      helperTest.assert(_template.files[0].data, _expectedXML);
    });

    it('should throw an error if the checkbox contain a list', function () {
      const _templateXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="gr1" style:family="graphic"><style:graphic-properties draw:textarea-vertical-align="middle" style:wrap="run-through" style:number-wrapped-paragraphs="no-limit" style:vertical-pos="from-top" style:horizontal-pos="from-left" style:horizontal-rel="paragraph"/></style:style></office:automatic-styles><office:body><office:text><office:forms form:automatic-focus="false" form:apply-design-mode="false"><form:form form:name="Form" form:apply-filter="true" form:command-type="table" form:control-implementation="ooo:com.sun.star.form.component.Form" office:target-frame=""><form:properties><form:property form:property-name="PropertyChangeNotificationEnabled" office:value-type="boolean" office:boolean-value="true"/><form:property form:property-name="TargetURL" office:value-type="string" office:string-value=""/></form:properties><form:checkbox form:name="{d.list[i].value}" form:control-implementation="ooo:com.sun.star.form.component.CheckBox" xml:id="control1" form:id="control1" form:label="Test_1" form:input-required="false" form:image-position="center" form:state="unchecked" form:current-state="unchecked"><form:properties><form:property form:property-name="ControlTypeinMSO" office:value-type="float" office:value="0"/><form:property form:property-name="DefaultControl" office:value-type="string" office:string-value="com.sun.star.form.control.CheckBox"/><form:property form:property-name="ObjIDinMSO" office:value-type="float" office:value="65535"/><form:property form:property-name="SecondaryRefValue" office:value-type="string" office:string-value=""/></form:properties></form:checkbox></form:form></office:forms><text:p text:style-name="Standard"><text:s text:c="5"/><draw:control text:anchor-type="as-char" svg:y="-0.379cm" draw:z-index="0" draw:name="Shape1" draw:style-name="gr1" draw:text-style-name="P2" svg:width="3.111cm" svg:height="1.08cm" draw:control="control1"/></text:p></office:text></office:body></office:document-content>';

      let _template = {
        files : [
          {
            name : 'content.xml',
            data : _templateXML
          }
        ]
      };
      try {
        form.preProcessODT(_template);
      } catch (err) {
        helperTest.assert(err.message, "Carbone does not support lists inside checkboxes.");
      }
    });

    it('should insert the marker and the checkbox formatter inside the "current-value" attribute', function () {
      const _templateXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="gr1" style:family="graphic"><style:graphic-properties draw:textarea-vertical-align="middle" style:wrap="run-through" style:number-wrapped-paragraphs="no-limit" style:vertical-pos="from-top" style:horizontal-pos="from-left" style:horizontal-rel="paragraph"/></style:style></office:automatic-styles><office:body><office:text><office:forms form:automatic-focus="false" form:apply-design-mode="false"><form:form form:name="Form" form:apply-filter="true" form:command-type="table" form:control-implementation="ooo:com.sun.star.form.component.Form" office:target-frame=""><form:properties><form:property form:property-name="PropertyChangeNotificationEnabled" office:value-type="boolean" office:boolean-value="true"/><form:property form:property-name="TargetURL" office:value-type="string" office:string-value=""/></form:properties><form:checkbox form:name="{d.value}" form:control-implementation="ooo:com.sun.star.form.component.CheckBox" xml:id="control1" form:id="control1" form:label="Test_1" form:input-required="false" form:image-position="center" form:state="unchecked" form:current-state="unchecked"><form:properties><form:property form:property-name="ControlTypeinMSO" office:value-type="float" office:value="0"/><form:property form:property-name="DefaultControl" office:value-type="string" office:string-value="com.sun.star.form.control.CheckBox"/><form:property form:property-name="ObjIDinMSO" office:value-type="float" office:value="65535"/><form:property form:property-name="SecondaryRefValue" office:value-type="string" office:string-value=""/></form:properties></form:checkbox></form:form></office:forms><text:p text:style-name="Standard"><text:s text:c="5"/><draw:control text:anchor-type="as-char" svg:y="-0.379cm" draw:z-index="0" draw:name="Shape1" draw:style-name="gr1" draw:text-style-name="P2" svg:width="3.111cm" svg:height="1.08cm" draw:control="control1"/></text:p></office:text></office:body></office:document-content>';
      const _expectedXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="gr1" style:family="graphic"><style:graphic-properties draw:textarea-vertical-align="middle" style:wrap="run-through" style:number-wrapped-paragraphs="no-limit" style:vertical-pos="from-top" style:horizontal-pos="from-left" style:horizontal-rel="paragraph"/></style:style></office:automatic-styles><office:body><office:text><office:forms form:automatic-focus="false" form:apply-design-mode="false"><form:form form:name="Form" form:apply-filter="true" form:command-type="table" form:control-implementation="ooo:com.sun.star.form.component.Form" office:target-frame=""><form:properties><form:property form:property-name="PropertyChangeNotificationEnabled" office:value-type="boolean" office:boolean-value="true"/><form:property form:property-name="TargetURL" office:value-type="string" office:string-value=""/></form:properties><form:checkbox form:name="" form:control-implementation="ooo:com.sun.star.form.component.CheckBox" xml:id="control1" form:id="control1" form:label="Test_1" form:input-required="false" form:image-position="center" form:state="unchecked" form:current-state="{d.value:checkbox}"><form:properties><form:property form:property-name="ControlTypeinMSO" office:value-type="float" office:value="0"/><form:property form:property-name="DefaultControl" office:value-type="string" office:string-value="com.sun.star.form.control.CheckBox"/><form:property form:property-name="ObjIDinMSO" office:value-type="float" office:value="65535"/><form:property form:property-name="SecondaryRefValue" office:value-type="string" office:string-value=""/></form:properties></form:checkbox></form:form></office:forms><text:p text:style-name="Standard"><text:s text:c="5"/><draw:control text:anchor-type="as-char" svg:y="-0.379cm" draw:z-index="0" draw:name="Shape1" draw:style-name="gr1" draw:text-style-name="P2" svg:width="3.111cm" svg:height="1.08cm" draw:control="control1"/></text:p></office:text></office:body></office:document-content>';

      let _template = {
        files : [
          {
            name : 'content.xml',
            data : _templateXML
          }
        ]
      };
      form.preProcessODT(_template);
      helperTest.assert(_template.files[0].data, _expectedXML);
    });

    it('should insert the marker and the checkbox formatter inside the "form:current-value" attribute and should create the "form:current-value" attribute if it does not exist', function () {
      const _templateXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="gr1" style:family="graphic"><style:graphic-properties draw:textarea-vertical-align="middle" style:wrap="run-through" style:number-wrapped-paragraphs="no-limit" style:vertical-pos="from-top" style:horizontal-pos="from-left" style:horizontal-rel="paragraph"/></style:style></office:automatic-styles><office:body><office:text><office:forms form:automatic-focus="false" form:apply-design-mode="false"><form:form form:name="Form" form:apply-filter="true" form:command-type="table" form:control-implementation="ooo:com.sun.star.form.component.Form" office:target-frame=""><form:properties><form:property form:property-name="PropertyChangeNotificationEnabled" office:value-type="boolean" office:boolean-value="true"/><form:property form:property-name="TargetURL" office:value-type="string" office:string-value=""/></form:properties><form:checkbox form:name="{d.value}" form:control-implementation="ooo:com.sun.star.form.component.CheckBox" xml:id="control1" form:id="control1" form:label="Test_1" form:input-required="false" form:image-position="center"><form:properties><form:property form:property-name="ControlTypeinMSO" office:value-type="float" office:value="0"/><form:property form:property-name="DefaultControl" office:value-type="string" office:string-value="com.sun.star.form.control.CheckBox"/><form:property form:property-name="ObjIDinMSO" office:value-type="float" office:value="65535"/><form:property form:property-name="SecondaryRefValue" office:value-type="string" office:string-value=""/></form:properties></form:checkbox></form:form></office:forms><text:p text:style-name="Standard"><text:s text:c="5"/><draw:control text:anchor-type="as-char" svg:y="-0.379cm" draw:z-index="0" draw:name="Shape1" draw:style-name="gr1" draw:text-style-name="P2" svg:width="3.111cm" svg:height="1.08cm" draw:control="control1"/></text:p></office:text></office:body></office:document-content>';
      const _expectedXML = '<?xml version="1.0" encoding="UTF-8"?><office:document-content><office:automatic-styles><style:style style:name="gr1" style:family="graphic"><style:graphic-properties draw:textarea-vertical-align="middle" style:wrap="run-through" style:number-wrapped-paragraphs="no-limit" style:vertical-pos="from-top" style:horizontal-pos="from-left" style:horizontal-rel="paragraph"/></style:style></office:automatic-styles><office:body><office:text><office:forms form:automatic-focus="false" form:apply-design-mode="false"><form:form form:name="Form" form:apply-filter="true" form:command-type="table" form:control-implementation="ooo:com.sun.star.form.component.Form" office:target-frame=""><form:properties><form:property form:property-name="PropertyChangeNotificationEnabled" office:value-type="boolean" office:boolean-value="true"/><form:property form:property-name="TargetURL" office:value-type="string" office:string-value=""/></form:properties><form:checkbox form:name="" form:control-implementation="ooo:com.sun.star.form.component.CheckBox" xml:id="control1" form:id="control1" form:label="Test_1" form:input-required="false" form:image-position="center" form:current-state="{d.value:checkbox}"><form:properties><form:property form:property-name="ControlTypeinMSO" office:value-type="float" office:value="0"/><form:property form:property-name="DefaultControl" office:value-type="string" office:string-value="com.sun.star.form.control.CheckBox"/><form:property form:property-name="ObjIDinMSO" office:value-type="float" office:value="65535"/><form:property form:property-name="SecondaryRefValue" office:value-type="string" office:string-value=""/></form:properties></form:checkbox></form:form></office:forms><text:p text:style-name="Standard"><text:s text:c="5"/><draw:control text:anchor-type="as-char" svg:y="-0.379cm" draw:z-index="0" draw:name="Shape1" draw:style-name="gr1" draw:text-style-name="P2" svg:width="3.111cm" svg:height="1.08cm" draw:control="control1"/></text:p></office:text></office:body></office:document-content>';

      let _template = {
        files : [
          {
            name : 'content.xml',
            data : _templateXML
          }
        ]
      };
      form.preProcessODT(_template);
      helperTest.assert(_template.files[0].data, _expectedXML);
    });
  })

  describe("Checkbox formatter :checkbox", function () {
    it('should return unchecked', function () {
      helperTest.assert(formFormatter.checkbox.call({}, null), 'unchecked');
      helperTest.assert(formFormatter.checkbox.call({}, undefined), 'unchecked');
      helperTest.assert(formFormatter.checkbox.call({}, []), 'unchecked');
      helperTest.assert(formFormatter.checkbox.call({}, {}), 'unchecked');
      helperTest.assert(formFormatter.checkbox.call({}, ""), 'unchecked');
      helperTest.assert(formFormatter.checkbox.call({}, NaN), 'unchecked');
      helperTest.assert(formFormatter.checkbox.call({}, false), 'unchecked');
      helperTest.assert(formFormatter.checkbox.call({}, 'false'), 'unchecked');
    });

    it('should return checked', function () {
      helperTest.assert(formFormatter.checkbox.call({}, [1, 2, "lala"]), 'checked');
      helperTest.assert(formFormatter.checkbox.call({}, { test : 2 }), 'checked');
      helperTest.assert(formFormatter.checkbox.call({}, "true"), 'checked');
      helperTest.assert(formFormatter.checkbox.call({}, 1234), 'checked');
      helperTest.assert(formFormatter.checkbox.call({}, true), 'checked');
    });
  });

  describe("Checkbox full report", function () {
    it('should insert dynamic checkbox inside an ODT document (Created from LO)', function (done) {
      const _testedReport = 'form/odt-checkboxes';
      const _data = {
        value1: 'false',
        value2: false,
        value3: [],
        value4: {},
        value5: '',
        value6: undefined,
        value7: null,
        value8: 10,
        value9: 'true',
        value10: true,
        value11: [1, 2, 3],
        value12: { value : true }
      };
      carbone.render(helperTest.openTemplate(_testedReport), _data, (err, res) => {
        helperTest.assert(err + '', 'null');
        helperTest.assertFullReport(res, _testedReport);
        done();
      });
    });
  });
});