<p align="center">
  <a href="https://carbone.io/" target="_blank">
    <img alt="CarboneJS" width="100" src="https://carbone.io/img/carbone_icon_v3_github.png">
  </a>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/carbone">
    <img src="https://badgen.net/npm/dt/carbone" alt="npm badge">
  </a>
  <a href="https://www.npmjs.com/package/carbone">
    <img src="https://badgen.net/npm/dm/carbone" alt="npm badge">
  </a>
  <a href="https://www.npmjs.com/package/carbone">
    <img src="https://badgen.net/npm/v/carbone" alt="carbone version badge">
  </a><br/>
  <a href="https://carbone.io/documentation.html">
    <img src="https://readthedocs.org/projects/ansicolortags/badge/?version=latest" alt="documentation badge">
  </a>
  <a href="https://bundlephobia.com/result?p=carbone">
    <img src="https://badgen.net/bundlephobia/minzip/carbone" alt="minizip badge">
  </a>
  <a href="https://hub.docker.com/r/carbone/carbone-ee">
    <img src="https://badgen.net/docker/pulls/carbone/carbone-ee?icon=docker" alt="docker badge">
  </a>
  <a href="https://github.com/carboneio/carbone">
    <img src="https://badgen.net/github/forks/carboneio/carbone?icon=github" alt="github fork badge">
  </a>
</p>

快速，简单，强大的报表生成器，可使用任何格式的PDF，DOCX，XLSX，ODT，PPTX，ODS，XML，CSV ...

...使用您的JSON数据作为输入！

## 检索目录
- [产品特征](#产品特征)
- [运作原理](#运作原理)
- [最低配置](#最低配置) (minimum requirements)
- [入门指南](#入门指南) (getting started)
- [更多例子](#更多例子)
- [API 参考](#API-参考)
- [命令行工具](#命令行工具)
- [更多问题](#更多问题)
- [技术路线](#技术路线)
- [性能](#性能)
- [许可证和版本](#许可证和版本)
- [运营理念](#运营理念)
- [贡献者](#贡献者)

## 产品特征
  - **操作极其简单**：仅使用LibreOffice™，OpenOffice™或Microsoft Office™来绘制您的报告
  - **无限的设计**：有限的是您的文档编辑器，分页，页眉，页脚，表格……
  - **转换文档**：借助集成的文档转换器
  - **独特的模板引擎**：直接在文档中插入类似JSON {d.companyName}的标记
  - **操作灵活**：使用任何XML文档作为模板，docx，odt，ods，xlsx，html，pptx，odp，自定义xml文件……
  - **面向未来**：强大的XML算法使您在不了解XML文件规格的情况下也自如使用
  - **多语言**：一种模板，多种语言。自动更新翻译文件
  - **格式化数据**：使用内置的日期和数字格式符或者或使用Javascript来创建您自己的格式
  - **迅捷**：支持多个LibreOffice线程文档转换，优化每个报告的代码生成

## 运作原理
Carbone是类似Mustache的模板引擎 。`{d.companyName}`
语言模板文档：https://carbone.io/documentation.html
  - 模板可以是来自LibreOffice™或Microsoft Office™的任何XML文档（ods，docx，odt，xslx ...）
  - 注入的数据必须是JSON对象或数组，例如来自您现有的API
Carbone将分析您的模板并在文档中注入数据。生成的文档可以按原样导出，或者使用LibreOffice将其转换为另一种格式（PDF...）如果您已安装LibreOffice。 Carbone仅在服务器端工作。

## 最低配置
  - NodeJS 10.x以上
  - 在OSX，Linux（服务器和台式机）和Windows上运行
#### 可选项
  - 如果要使用文档转换器并生成PDF，请使用LibreOffice。如果没有LibreOffice，您仍然可以生成docx，xl​​sx，pptx，odt，ods，odp，html，只要您的模板格式相同。

## 入门指南
### 基本样本

1. 安装
```bash
  npm install carbone
```

2. 将此代码复制粘贴到新的JS文件中，并使用node执行它
```js
  const fs = require('fs');
  const carbone = require('carbone');

  // Data to inject
  var data = {
    firstname : 'John',
    lastname : 'Doe'
  };

  // Generate a report using the sample template provided by carbone module
  // This LibreOffice template contains "Hello {d.firstname} {d.lastname} !"
  // Of course, you can create your own templates!
  carbone.render('./node_modules/carbone/examples/simple.odt', data, function(err, result){
    if (err) {
      return console.log(err);
    }
    // write the result
    fs.writeFileSync('result.odt', result);
  });
```

### PDF生成，文档转换
Carbone有效地使用LibreOffice来转换文档。在所有经过测试的解决方案中，它是目前生产中最可靠，最稳定的解决方案。

Carbone的幕后运转：
  - 以“服务器模式”启动LibreOffice：无头，无加载用户界面
  - 以最大化性能管理多个LibreOffice Worker（可配置的数量）
  - 如果崩溃或不响应，则自动重新启动
  - 作业队列，如果发生问题，将重试转换3次

##### 1 – 安装LibreOffice

###### 在OSX上
  - 建议在https://www.libreoffice.org/ 上安装LibreOffice稳定版。

###### 在 Ubuntu服务器和 Ubuntu桌面上
> 请注意，由PPA libreoffice / ppa提供的LibreOffice并未捆绑python（Carbone的强制性）。最好的办法是从官方网站下载LibreOffice软件包并手动安装：
```bash
  # remove all old version of LibreOffice
  sudo apt remove --purge libreoffice*
  sudo apt autoremove --purge

  # Download LibreOffice debian package. Select the right one (64-bit or 32-bit) for your OS.
  # Get the latest from http://download.documentfoundation.org/libreoffice/stable
  # or download the version currently "carbone-tested":
  wget https://downloadarchive.documentfoundation.org/libreoffice/old/6.4.5.2/deb/x86_64/LibreOffice_6.4.5.2_Linux_x86-64_deb.tar.gz

  # Install required dependencies on ubuntu server for LibreOffice 6.0+
  sudo apt install libxinerama1 libfontconfig1 libdbus-glib-1-2 libcairo2 libcups2 libglu1-mesa libsm6

  # Uncompress package
  tar -zxvf LibreOffice_6.4.5.2_Linux_x86-64_deb.tar.gz
  cd LibreOffice_6.4.5.2_Linux_x86-64_deb/DEBS

  # Install LibreOffice
  sudo dpkg -i *.deb

  # If you want to use Microsoft fonts in reports, you must install the fonts
  # Andale Mono, Arial Black, Arial, Comic Sans MS, Courier New, Georgia, Impact,
  # Times New Roman, Trebuchet, Verdana,Webdings)
  sudo apt install ttf-mscorefonts-installer

  # If you want to use special characters, such as chinese ideograms, you must install a font that support them
  # For example:
  sudo apt install fonts-wqy-zenhei

  # If you want to use barcode fonts
  cd ~
  wget https://github.com/graphicore/librebarcode/releases/download/v1.003-alpha/LibreBarcode_v1.003-alpha.zip
  sudo unzip LibreBarcode_v1.003-alpha.zip -d /usr/share/fonts/truetype/librebarcode
  sudo chmod 755 /usr/share/fonts/truetype/librebarcode
  sudo chmod -R 644 /usr/share/fonts/truetype/librebarcode/*
  # refresh fonts, if the following command does not run, sudo apt install fontconfig
  sudo fc-cache -fv
```

##### 2 – 生成PDF
现在，您可以通过渲染方法来使用转换器。

> 不要惊慌，只有第一次转换很慢，因为LibreOffice必须启动。一旦启动，LibreOffice会不断加快新转换的速度

```javascript
  var data = {
    firstname : 'John',
    lastname : 'Doe'
  };

  var options = {
    convertTo : 'pdf' //can be docx, txt, ...
  };

  carbone.render('./node_modules/carbone/examples/simple.odt', data, options, function(err, result){
    if (err) return console.log(err);
    fs.writeFileSync('result.pdf', result);
    process.exit(); // to kill automatically LibreOffice workers
  });
```

## 更多例子
##### docx文档和电子表格中的嵌套重复
```javascript
  var data = [
    {
      movieName : 'Matrix',
      actors    : [{
        firstname : 'Keanu',
        lastname  : 'Reeves'
      },{
        firstname : 'Laurence',
        lastname  : 'Fishburne'
      },{
        firstname : 'Carrie-Anne',
        lastname  : 'Moss'
      }]
    },
    {
      movieName : 'Back To The Future',
      actors    : [{
        firstname : 'Michael',
        lastname  : 'J. Fox'
      },{
        firstname : 'Christopher',
        lastname  : 'Lloyd'
      }]
    }
  ];

  carbone.render('./node_modules/carbone/examples/movies.docx', data, function(err, result){
    if (err) return console.log(err);
    fs.writeFileSync('movies_result.docx', result);
  });

  carbone.render('./node_modules/carbone/examples/flat_table.ods', data, function(err, result){
    if (err) return console.log(err);
    fs.writeFileSync('flat_table_result.ods', result);
  });
```

## API 参考

要查看api参考和文档，请访问carbone.io。 

## 命令行工具

要签出Carbone CLI文档，请访问carbone.io

## 更多问题

如果您遇到任何问题，请在Github上搜索类似的问题。若此类问题尚不存在，请创建一个问题来帮助我们。

## 技术路线

请在github问题列表上查阅技术路线。

## 性能

使用单页DOCX基础模板，报告生成速度为（无网络延迟的情况下）：
  - 无需文档转换（分析，注入，渲染）：10毫秒/报告
  - 具有PDF转换（100个程序循环，3个LibreOffice worker，无冷启动）： 50毫秒/报告

以上结果为在2015年年中发行的MacBook Pro 2,2 Ghz i7、16Go上的使用情况。

## 许可证和版本

Carbone有两个版本：
  - 根据CCL Agreement许可，用户可以免费获得Carbone社区版
  - Carbone Enterprise Edition（托管和内部部署）包括用户界面等其他功能。
因为我们要遵循Gitlab的模型，所以免费版本必须保持慷慨。

## 运营理念

> 我们的最终目标 ：
我们将把2 %的收入用于三种慈善事业：我们热爱的软件开发，教育和环境保护。
我们已定的受益者名单如下❤️
  - LibreOffice基金会
  - PostgreSQL基金会
  - 一所法国的创新儿童学校

## 贡献者

感谢所有CarboneIO的贡献者（按随机顺序排列）
  - Florian Bezagu
  - Matthieu Robin
  - Arnaud Lelièvre
  - Maxime Vincent
  - Enzo Ghemard
  - Jordan Nourry
  - Etienne Rouillard
  - Guillaume Chevaux
  - Fabien Bigant
  - Maxime Magne
  - Vincent Bertin
  - Léo Labruyère
  - Aurélien Kermabon
  - [Steeve Payraudeau](https://github.com/steevepay)