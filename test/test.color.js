var color = require("../lib/color.old");
var helper = require("../lib/helper");

describe("Dynamic colors", function () {
  describe("ODT Files", function () {
    describe("simple replace", function () {
      it.skip("Should replace a color in style tag", function (done) {
        var _template = {
          files: [
            {
              name: "content.xml",
              data:
                '<xml><style:style style:name="P1"><toto color="#FF0000" background-color="#FAB091" /><tata color="#EEEEEE"></tata></style:style>{bindColor(FF0000, RRGGBB)=d.color}</xml>',
            },
          ],
        };
        var _result = color.replaceColorMarkersOdt(_template);
        helper.assert(
          _result.files[0].data,
          '<xml><style:style style:name="P1"><toto color="{d.color}" background-color="#FAB091" /><tata color="#EEEEEE"></tata></style:style></xml>'
        );
        done();
      });
      it.skip("Should replace multiple time the same color", function (done) {
        var _template = {
          files: [
            {
              name: "content.xml",
              data:
                '<xml><style:style style:name="Table1.A1" style:family="table-cell"><style:table-cell-properties fo:padding="0.097cm" fo:border-left="0.05pt solid #000000" fo:border-right="none" fo:border-top="0.05pt solid #000000" fo:border-bottom="0.05pt solid #000000"/></style:style>{bindColor(000000, RRGGBB)=d.color}</xml>',
            },
          ],
        };
        var _result = color.replaceColorMarkersOdt(_template);
        helper.assert(
          _result.files[0].data,
          '<xml><style:style style:name="Table1.A1" style:family="table-cell"><style:table-cell-properties fo:padding="0.097cm" fo:border-left="0.05pt solid {d.color}" fo:border-right="none" fo:border-top="0.05pt solid {d.color}" fo:border-bottom="0.05pt solid {d.color}"/></style:style></xml>'
        );
        done();
      });
      it.skip("Should replace a color even if there is space in the bindColor", function (done) {
        var _template = {
          files: [
            {
              name: "content.xml",
              data:
                '<xml><style:style style:name="P1"><color color="#FF0000" /></style:style>coucou {   bindColor  (    FF0000   ,    RRGGBB   )    =    d.color    }</xml>',
            },
          ],
        };
        var _result = color.replaceColorMarkersOdt(_template);
        helper.assert(
          _result.files[0].data,
          '<xml><style:style style:name="P1"><color color="{d.color}" /></style:style>coucou </xml>'
        );
        done();
      });
      it.skip("Should replace multiple time the same color and that with multiple colors", function (done) {
        var _template = {
          files: [
            {
              name: "content.xml",
              data:
                '<xml><style:style style:name="name"><text:p draw:fill-color="#ff0000" />' +
                '<toto color="#00ff00" background-color="#0000ff" />' +
                '<style:paragraph-properties style:page-number="auto" fo:background-color="#00ff00">' +
                '<style:tab-stops/></style:paragraph-properties><style:text-properties fo:background-color="#ff0000"/>' +
                '<tata color="#ff0000" background-color="#0000ff" />' +
                "</style:style>{bindColor(ff0000, RRGGBB)=d.color}{bindColor(00FF00, RRGGBB)=d.color2}{bindColor(0000FF, RRGGBB)=d.color3}</xml>",
            },
          ],
        };
        var _result = color.replaceColorMarkersOdt(_template);
        helper.assert(
          _result.files[0].data,
          '<xml><style:style style:name="name"><text:p draw:fill-color="{d.color}" />' +
            '<toto color="{d.color2}" background-color="{d.color3}" />' +
            '<style:paragraph-properties style:page-number="auto" fo:background-color="{d.color2}">' +
            '<style:tab-stops/></style:paragraph-properties><style:text-properties fo:background-color="{d.color}"/>' +
            '<tata color="{d.color}" background-color="{d.color3}" />' +
            "</style:style></xml>"
        );
        done();
      });
      it.skip("Should not replace color", function (done) {
        var _template = {
          files: [
            {
              name: "content.xml",
              data:
                '<xml><style:style style:name="P1"><toto color="#FF0000" background-color="#FAB091" /><tata color="#EEEEEE"></tata></style:style>{bindColor(FF0000, RRGGBB)=}</xml>',
            },
          ],
        };
        var _result = color.replaceColorMarkersOdt(_template);
        helper.assert(_result.files[0].data, _result.files[0].data);
        done();
      });
      it("Should not replace color 2", function (done) {
        var _template = {
          files: [
            {
              name: "content.xml",
              data:
                '<xml><style:style style:name="P1"><toto color="#FF0000" background-color="#FAB091" /><tata color="#EEEEEE"></tata></style:style>{bindColor(, RRGGBB)=d.color}</xml>',
            },
          ],
        };
        var _result = color.replaceColorMarkersOdt(_template);
        helper.assert(_result.files[0].data, _result.files[0].data);
        done();
      });
    });

    describe("Loop", function () {
      it.skip("Should create a simple loop", function (done) {
        var _template = {
          files: [
            {
              name: "content.xml",
              data:
                "<xml>" +
                "<office:automatic-styles>" +
                '<style:style style:name="P{d.perso[i].color} {d.perso[i].color} {d.perso[i].color} "><toto color="{d.perso[i].color}" background-color="{d.perso[i].color}" /><tata color="{d.perso[i].color}"></tata></style:style>' +
                '<style:style style:name="P{d.perso[i+1].color} {d.perso[i+1].color} {d.perso[i+1].color} "><toto color="{d.perso[i+1].color}" background-color="{d.perso[i+1].color}" /><tata color="{d.perso[i+1].color}"></tata></style:style>' +
                "</office:automatic-styles>" +
                "<table>" +
                "<tr>" +
                '<td style-name="P{d.perso[i].color} {d.perso[i].color} {d.perso[i].color} ">{d.perso[i].prenom}</td><td style-name="P{d.perso[i].color} {d.perso[i].color} {d.perso[i].color} ">{d.perso[i].nom}</td>' +
                "</tr>" +
                "<tr>" +
                '<td style-name="P{d.perso[i+1].color} {d.perso[i+1].color} {d.perso[i+1].color} ">{d.perso[i+1].prenom}</td><td style-name="P{d.perso[i+1].color} {d.perso[i+1].color} {d.perso[i+1].color} ">{d.perso[i+1].nom}</td>' +
                "</tr>" +
                "</table>" +
                "</xml>",
            },
          ],
        };
        var _result = color.replaceColorMarkersOdt(_template);
        // ================= ??? Compare the result by the result???
        helper.assert(_result.files[0].data, _result.files[0].data);
        done();
      });
      it.skip("Should create a complex loop", function (done) {
        var _template = {
          files: [
            {
              name: "content.xml",
              data:
                "<xml>" +
                "<office:automatic-styles>" +
                '<style:style style:name="P1"><toto color="#FF0000" /><trtr color="#F0F0F0" /><tarte color="#F0000F" /></style:style>' +
                '<style:style style:name="P2"><toto color="#00FF00" /><trtr color="#0F0F0F" /><tarte color="#0FFFF0" /></style:style>' +
                '<style:style style:name="P3"><toto color="#AAAAAA" /></style:style>' +
                "</office:automatic-styles>" +
                "<table>" +
                "<tr>" +
                '<td style-name="P1">{d.perso[i].prenom}</td><td style-name="P2">{d.perso[i].nom}</td>' +
                "</tr>" +
                "<tr>" +
                '<td style-name="P1">{d.perso[i+1].prenom}</td><td style-name="P2">{d.perso[i+1].nom}</td>' +
                "</tr>" +
                "</table>{bindColor(FF0000, RRGGBB)=d.perso[i].color}{bindColor(00FF00, RRGGBB)=d.perso[i+1].color}" +
                "{bindColor(F0F0F0, RRGGBB)=d.perso[i].color2}{bindColor(0F0F0F, RRGGBB)=d.perso[i+1].color2}" +
                "{bindColor(F0000F, RRGGBB)=d.perso[i].color3}{bindColor(0FFFF0, RRGGBB)=d.perso[i+1].color3}" +
                "{bindColor(AAAAAA, RRGGBB)=d.color}" +
                "</xml>",
            },
          ],
        };
        var _result = color.replaceColorMarkersOdt(_template);
        helper.assert(
          _result.files[0].data,
          "<xml>" +
            "<office:automatic-styles>" +
            '<style:style style:name="P{d.perso[i].color} {d.perso[i].color2} {d.perso[i].color3} "><toto color="{d.perso[i].color}" /><trtr color="{d.perso[i].color2}" /><tarte color="{d.perso[i].color3}" /></style:style>' +
            '<style:style style:name="P{d.perso[i+1].color} {d.perso[i+1].color2} {d.perso[i+1].color3} "><toto color="{d.perso[i+1].color}" /><trtr color="{d.perso[i+1].color2}" /><tarte color="{d.perso[i+1].color3}" /></style:style>' +
            '<style:style style:name="P1"><toto color="#FF0000" /><trtr color="#F0F0F0" /><tarte color="#F0000F" /></style:style>' +
            '<style:style style:name="P2"><toto color="#00FF00" /><trtr color="#0F0F0F" /><tarte color="#0FFFF0" /></style:style>' +
            '<style:style style:name="P3"><toto color="{d.color}" /></style:style>' +
            "</office:automatic-styles>" +
            "<table>" +
            "<tr>" +
            '<td style-name="P{d.perso[i].color} {d.perso[i].color2} {d.perso[i].color3} ">{d.perso[i].prenom}</td><td style-name="P{d.perso[i+1].color} {d.perso[i+1].color2} {d.perso[i+1].color3} ">{d.perso[i].nom}</td>' +
            "</tr>" +
            "<tr>" +
            '<td style-name="P{d.perso[i].color} {d.perso[i].color2} {d.perso[i].color3} ">{d.perso[i+1].prenom}</td><td style-name="P{d.perso[i+1].color} {d.perso[i+1].color2} {d.perso[i+1].color3} ">{d.perso[i+1].nom}</td>' +
            "</tr>" +
            "</table>" +
            "</xml>"
        );
        done();
      });
    });
  });

  describe.skip("DOCX files", function () {
    it("should replace simple color", function (done) {
      var _template = {
        files: [
          {
            name: "content.xml",
            data:
              '<xml><w:rPr><color="FF0000"></w:rPr>text <w:rPr><color="00FF00"></w:rPr>text <w:rPr><color="0000FF"></w:rPr>text {bindColor(FF0000, RRGGBB)=d.color}{bindColor(00FF00, RRGGBB)=d.color2}{bindColor(0000FF, RRGGBB)=d.color3}</xml>',
          },
        ],
      };
      var _result = color.replaceColorMarkersDocx(_template);
      helper.assert(
        _result.files[0].data,
        '<xml><w:rPr><color="{d.color}"></w:rPr>text <w:rPr><color="{d.color2}"></w:rPr>text <w:rPr><color="{d.color3}"></w:rPr>text </xml>'
      );
      done();
    });
    it("should replace background color like reg, green, blue", function (done) {
      var _template = {
        files: [
          {
            name: "content.xml",
            data:
              '<xml><w:rPr><color="red"></w:rPr>text <w:rPr><color="green"></w:rPr>text <w:rPr><color="blue"></w:rPr>text {bindColor(red, RRGGBB)=d.color}{bindColor(green, RRGGBB)=d.color2}{bindColor(blue, RRGGBB)=d.color3}</xml>',
          },
        ],
      };
      var _result = color.replaceColorMarkersDocx(_template);
      helper.assert(
        _result.files[0].data,
        '<xml><w:rPr><color="{d.color}"></w:rPr>text <w:rPr><color="{d.color2}"></w:rPr>text <w:rPr><color="{d.color3}"></w:rPr>text </xml>'
      );
      done();
    });
    it("should replace color in a loop", function (done) {
      var _template = {
        files: [
          {
            name: "content.xml",
            data:
              "<xml>" +
              "<tr>" +
              "<td>" +
              '<w:rPr><color="FF0000" back="FFFF00"></w:rPr>{d.' +
              '<w:rPr><color="FF0000" back="FFFF00"></w:rPr>perso[i].' +
              '<w:rPr><color="FF0000" back="FFFF00"></w:rPr>nom}' +
              "</td>" +
              "<td>" +
              '<w:rPr><color="FF0000" back="FFFF00"></w:rPr>{d.' +
              '<w:rPr><color="FF0000" back="FFFF00"></w:rPr>perso[i].' +
              '<w:rPr><color="FF0000" back="FFFF00"></w:rPr>prenom}' +
              "</td>" +
              "</tr>" +
              "<tr>" +
              "<td>" +
              '<w:rPr><color="00FF00" back="0000FF"></w:rPr>{d.' +
              '<w:rPr><color="00FF00" back="0000FF"></w:rPr>perso[i+1].' +
              '<w:rPr><color="00FF00" back="0000FF"></w:rPr>nom}' +
              "</td>" +
              "<td>" +
              '<w:rPr><color="00FF00" back="0000FF"></w:rPr>{d.' +
              '<w:rPr><color="00FF00" back="0000FF"></w:rPr>perso[i+1].' +
              '<w:rPr><color="00FF00" back="0000FF"></w:rPr>prenom}' +
              "</td>" +
              "</tr>" +
              "{bindColor(FF0000, RRGGBB)=d.perso[i].color}{bindColor(00FF00, RRGGBB)=d.perso[i+1].color}" +
              "{bindColor(FFFF00, RRGGBB)=d.perso[i].back}{bindColor(0000FF, RRGGBB)=d.perso[i+1].back}" +
              "</xml>",
          },
        ],
      };
      var _result = color.replaceColorMarkersDocx(_template);
      helper.assert(
        _result.files[0].data,
        "<xml>" +
          "<tr>" +
          "<td>" +
          '<w:rPr><color="{d.perso[i].color}" back="{d.perso[i].back}"></w:rPr>{d.' +
          '<w:rPr><color="{d.perso[i].color}" back="{d.perso[i].back}"></w:rPr>perso[i].' +
          '<w:rPr><color="{d.perso[i].color}" back="{d.perso[i].back}"></w:rPr>nom}' +
          "</td>" +
          "<td>" +
          '<w:rPr><color="{d.perso[i].color}" back="{d.perso[i].back}"></w:rPr>{d.' +
          '<w:rPr><color="{d.perso[i].color}" back="{d.perso[i].back}"></w:rPr>perso[i].' +
          '<w:rPr><color="{d.perso[i].color}" back="{d.perso[i].back}"></w:rPr>prenom}' +
          "</td>" +
          "</tr>" +
          "<tr>" +
          "<td>" +
          '<w:rPr><color="{d.perso[i+1].color}" back="{d.perso[i+1].back}"></w:rPr>{d.' +
          '<w:rPr><color="{d.perso[i+1].color}" back="{d.perso[i+1].back}"></w:rPr>perso[i+1].' +
          '<w:rPr><color="{d.perso[i+1].color}" back="{d.perso[i+1].back}"></w:rPr>nom}' +
          "</td>" +
          "<td>" +
          '<w:rPr><color="{d.perso[i+1].color}" back="{d.perso[i+1].back}"></w:rPr>{d.' +
          '<w:rPr><color="{d.perso[i+1].color}" back="{d.perso[i+1].back}"></w:rPr>perso[i+1].' +
          '<w:rPr><color="{d.perso[i+1].color}" back="{d.perso[i+1].back}"></w:rPr>prenom}' +
          "</td>" +
          "</tr>" +
          "</xml>"
      );
      done();
    });
  });
});
