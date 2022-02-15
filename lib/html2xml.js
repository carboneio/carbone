const html2json = require('html2json').html2json;
const htmlEntities = require('./htmlentities');

const TAGS = {
  docx : {
    start_text : '<w:t>',
    end_text : '</w:t>',
    b : '<w:b/>',
    u : '<w:u/>',
    i : '<w:i/>',
    color : (hex) => { return `<w:color w:val="${hex}"/>` },
  }
}

let listId = 1

class html2xml {

  constructor(html) {
    this.html = html
    this.result = []
    this.TAGS = TAGS
    this.hasError = false 
    this.json = {}
    this.iter = 0
  }

  toJSON() {

    let json = null

    try {
      this.html = htmlEntities.decode(this.html);
      this.html = this.html.replace(/\n/g, "")
      this.html = this.html.replace(/\t/g, "")
      this.json = html2json(this.html);
    }
    catch(error) {
      this.hasError = true 
    }

  }

  getXML() {

    this.toJSON()

    var temp = [`</w:t></w:r></w:p><w:p>`] 
    if(!this.hasError && this.json) {
      this.convert(this.json)
      temp.push(this.result.join(""))
    }
    else {
      var html = this.html.replace(/<[\s\S]*?>/gi, "")
      temp.push(`<w:r><w:t>${html}</w:t></w:r></w:p><w:p>`)
    }
    
    temp.push(`<w:r><w:t>`)
    const xml = temp.join("")

    return xml;

  }

  buildStyles(styles) {
    const temp = Array.isArray(styles) ? styles : typeof styles === "string" ? [styles] : []
    const _styles = temp.join("").split(";")
    const props = {}
    _styles.map( style => {
      if( typeof style === "string" && style.length > 0) {
        var arg_val = style.split(':')
        if( Array.isArray(arg_val) && arg_val.length === 2) {
          var arg = arg_val[0]
          var val = arg_val[1]
          props[arg] = val
        }
      }
    })
    return props
  }

  setProps(child, deep = 0) {

    if(child.tag === "p") {
      if(Array.isArray(child.child) && child.child.length>0) {
        child.child[0].properties = child.child[0].properties || {}
        child.child[0].properties.firstItem = true 
        child.child[child.child.length-1].properties = child.child[child.child.length-1].properties || {}
        child.child[child.child.length-1].properties.newParagraph = true
      }
    }
    else if(child.tag === "table") {
      console.log(child)
      child.properties.hasBorder = child.attr && child.attr.border
      child.properties.cellpadding = child.attr && child.attr.cellpadding
      child.properties.cellspacing = child.attr && child.attr.cellspacing
      child.properties.tableStyle = child.attr && child.attr.style
      child.properties.table = true
    }
    else if(child.tag === "tbody") {
      child.properties.tbodyStyle = child.attr && child.attr.style
      child.properties.tbody = true
      child.child.map( (_child, i) => {
        _child.properties = _child.properties || {}
        _child.properties.row = i 
        if(i === child.child.length-1) _child.properties.lastRow = true 
      })
    }
    else if(child.tag === "tr") {
      child.properties.trStyle = child.attr && child.attr.style
      child.properties.numCols = child.child.length
      child.child.map( (_child, i) => {
        _child.properties = _child.properties || {}
        _child.properties.col = i 
        if(i === child.child.length-1) _child.properties.lastCol = true 
      })
    }
    else if(child.tag === "td") {
      child.properties.tdStyle = child.attr && child.attr.style
    }
    else if(child.tag === "h1") {

    }
    else if(child.tag === "h2") {

    }
    else if(child.tag === "strong") {
      child.properties.bold = true 
    }
    else if(child.tag === "b") {
      child.properties.bold = true 
    }
    else if(child.tag === "em") {
      child.properties.italic = true 
    }
    else if(child.tag === "u") {
      child.properties.underline = true 
    }
    else if(child.tag === "sub") {
      child.properties.subScript = true 
    }
    else if(child.tag === "sup") {
      child.properties.supScript = true 
    }
    else if(child.tag === "s") {
      child.properties.strike = true 
    }
    else if(child.tag === "span") {
      
    }
    else if(child.tag === "ul") {
      child.properties.listType = "bullet"
      child.properties.listId = child.properties.listId || listId++
    }
    else if(child.tag === "ol") {
      child.properties.listType = "numbering"
      child.properties.listId = child.properties.listId || listId++
    }
    else if(child.tag === "li") {

      child.properties.list = true 
      child.properties.newParagraph = true 
      child.properties.deep = child.parent.properties.deep + 1 || deep
      // child.properties.numId = child.properties.listId+"_"+child.properties.deep

      if(child.properties.listType === "bullet") {
        child.properties.listTypeXML = "Paragraphedeliste"            
      }
      else if(child.properties.listType === "numbering") {
        child.properties.listTypeXML = "ListParagraph"
      }
      else {

      }
    }
  }

  buildText(child) {

    const props = child.properties || {}
    var text = []
    text.push(`<w:r>`)
    
    if(props) {

      if(props.list) {

        let deep = 0
        if(props.listTypeXML === "ListParagraph") {
          deep = +props.deep + 1
        }

        const list = `
          <w:pPr>
            <w:pStyle w:val="${props.listTypeXML}"/>
            <w:numPr>
              <w:ilvl w:val="${deep}"/>
              <w:numId w:val="${props.listId}"/>
            </w:numPr>
            <w:ind w:left="${720 + 360 * (+props.deep + 1)}"/>
          </w:pPr>
        `
        text.push(list)

      }

      text.push('<w:rPr>')
      if(props.strike) text.push('<w:strike w:val="true" />')
      else if(props.dstrike)  text.push('<w:dstrike w:val="true" />')
      if(props.italic) text.push('<w:i w:val="true"/>')
      if(props.bold) text.push('<w:b w:val="true"/>')
      if(props.underline) text.push('<w:u w:val="single"/>')
      

      if(props.style) {

        let styles = this.buildStyles(props.style)

        for (var arg in styles) {
          if (styles.hasOwnProperty(arg)) {
            const val = styles[arg]
            // console.log(arg, val)
            if(arg === "color") {
              var rgb = val.startsWith("#") ? val.substring(1) : null
              if (rgb !== null) {
                text.push(`<w:color w:val="${rgb.toUpperCase()}"/>`)
              }
            }
            else if(arg === "background-color") {
              var rgb = val.startsWith("#") ? val.substring(1) : null
              if (rgb !== null) {
                text.push(`<w:shd w:val="clear" w:color="33FF49" w:fill="${rgb.toUpperCase()}"/>`)
              }
            }
            else if(arg === "font-size") {
              let size = val.toLowerCase()
              size = size.endsWith("px") ? size.slice(0,-2) : null
              if (size !== null) {
                const factor = 1.25
                const _size = +size * factor 
                text.push(`<w:sz w:val="${_size}"/><w:szCs w:val="${_size}"/>`)
              }
            }
            else if(arg === "text-align") {
              if(val === "right" | val === "left" | val === "center") {
                text.push(`<w:jc w:val="${val}"/>`)
              }
            }
          }
        }

      }
      text.push('</w:rPr>')

      let _text = child.text
      text.push(`<w:t xml:space="preserve">${_text}</w:t>`)
      text.push(`</w:r>`)

      if(props.newParagraph) {
        text.push(`</w:p><w:p>`)
      }
      

      /// Si jamais c'est dans un tableau 
      if(props.table) {

        const tdStyles = this.buildStyles(props.tdStyle)
        const tableStyles = this.buildStyles(props.tableStyle)
        const table_total_width = 9000; // 100% de la largeur 

        // const table_width = tableStyles.width.endsWith("px") ? tableStyles.width.substring(-2) : 
        // const column_width = tdStyles.width.endsWith("px") ? tdStyles.width.substring(-2) : 

        // console.log(table_width, column_width)

          if(props.col === 0 && props.row === 0) {
            const wsz = 8;
            this.result.push(`</w:p>\n<w:tbl><w:tblPr>`)
            if(props.hasBorder) {
              this.result.push(`
                <w:tblBorders>
                  <w:top w:val="single" w:sz="${wsz}" w:space="0" w:color="000000" />
                  <w:start w:val="single" w:sz="${wsz}" w:space="0" w:color="000000" />
                  <w:bottom w:val="single" w:sz="${wsz}" w:space="0" w:color="000000" />
                  <w:end w:val="single" w:sz="${wsz}" w:space="0" w:color="000000" />
                  <w:insideH w:val="single" w:sz="${wsz-2}" w:space="0" w:color="000000" />
                  <w:insideV w:val="single" w:sz="${wsz-2}" w:space="0" w:color="000000" />
                </w:tblBorders>
              `)
            }
            this.result.push(`
              <w:tblW w:w="0" w:type="auto"/>
              </w:tblPr>
            \n\t<w:tr>\n\t\t<w:tc><w:tcPr><w:tcW w:w="1000" w:type="dxa"/></w:tcPr>\n\t\t\t<w:p>`)
          }
          else if(props.col > 0) this.result.push(`</w:p>\n\t\t</w:tc>\n\t\t<w:tc><w:tcPr><w:tcW w:w="1000" w:type="dxa"/></w:tcPr>\n\t\t\t<w:p>`)
          
          this.result.push(text.join(""))

          if(props.lastCol && props.lastRow) this.result.push(`</w:p>\n\t\t</w:tc>\n\t</w:tr>\n</w:tbl>\n<w:p>`)
          else if(props.lastCol) this.result.push(`</w:p>\n\t\t</w:tc>\n\t</w:tr>\n\t<w:tr>\n\t\t<w:tc><w:tcPr><w:tcW w:w="1000" w:type="dxa"/></w:tcPr>\n\t\t\t<w:p>`)

        
      }
      else {
        this.result.push(text.join(""))
      }
      
    }

  }

  convert(item) {

    const tableTags = ["table", "tbody", "tr", "td", "thead", "th", "tfoot"]

    if(Array.isArray(item.child) && item.child.length>0) {

      item.child.map( (child, i) => {

        child.parent = item
        child.properties = Object.assign(child.properties || {}, child.parent.properties) || {} 

        if(child.attr && child.attr.style && tableTags.indexOf(child.tag) < 0 ) {
          child.properties.style = child.attr.style
        }

        if(child.node === "element") {

          this.setProps(child)
          this.convert(child)

        }

        else if(child.node === "text" && typeof child.text === "string") {
          
          this.buildText(child)

        }

      })

    }

  }

}





module.exports = html2xml
