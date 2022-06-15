/* eslint-disable no-undef */

const NATIVE_FILE_SYSTEM_IS_ACTIVE = 'showOpenFilePicker' in window;

function isSafari () {
  return /apple/i.test(navigator.vendor);
}

const carboneConfig = {
  apiVersion : 2,
  apiUrl     : window.location.origin
};

const carboneRenderObj = {
  data          : {},
  complement    : {},
  enum          : {},
  translations  : {},
  isDebugActive : true,
  convertTo     : 'pdf',
  lang          : 'en-US'
};

const currentTemplate = {
  id            : '',
  filename      : '',
  lastModified  : null,
  watchInterval : null
};

const codeEditor = {
  activePan         : 'data',
  prevActiveTabDOM  : document.getElementById('data'),
  timeoutJSONChange : null
};

// JSON Editor
const JSONEditorOptions = {
  onChange : () => {
    if (isJsonValid() === false) {
      return;
    }
    carboneRenderObj[codeEditor.activePan] = editor.get();
    if (codeEditor.timeoutJSONChange !== null) {
      clearTimeout(codeEditor.timeoutJSONChange);
    }
    codeEditor.timeoutJSONChange = setTimeout(refreshRender, 2000);
  }
};
const editor = new JSONEditor(document.getElementById('jsoneditor'), JSONEditorOptions);
editor.setMode('code');
editor.set({});

// PDF Viewer
const pdfviewer = document.getElementById('pdfviewerobject');
pdfviewer.data = '';
if (!isSafari()) {
  // Safari is buggy when this property is set
  pdfviewer.type = 'application/pdf';
}

// Drag and drop
const holder = document.getElementById('dropContainer');
holder.ondragover = function (e) {
  e.preventDefault();
};
holder.ondragend = function (e) {
  e.preventDefault();
};
holder.ondrop = function (e) {
  e.preventDefault();
  // TODO use https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/getAsFileSystemHandle
  addTemplateAndRender(e.dataTransfer.files[0]);
};

// eslint-disable-next-line
async function uploadTemplate (e, eventType) {
  event.stopPropagation(); // stop bubbling
  // Only on browser which support Native FileSystem API (Chrome-like)
  if (eventType === 'click' && NATIVE_FILE_SYSTEM_IS_ACTIVE === true) {
    event.preventDefault(); // must be called as soon as possible to stop the default file upload behavior
    try {
      let [_fileHandle] = await window.showOpenFilePicker();
      let _file = await _fileHandle.getFile();
      addTemplateAndRender(_file);
      watchTemplate(_file.lastModified, _fileHandle);
    }
    catch (e) {
      setConsoleMessage('error', 'Cannot get template ' + e.toString());
    }
    return;
  }
  // Else, on other browser, listen "onchange" event
  let _file = e.files[0];
  addTemplateAndRender(_file);
}

function watchTemplate (currentLastModified, fileHandle) {
  clearInterval(currentTemplate.watchInterval);
  currentTemplate.lastModified = currentLastModified;
  currentTemplate.watchInterval = setInterval(async () => {
    let _newFile = await fileHandle.getFile();
    if (_newFile !== null && _newFile.lastModified !== currentTemplate.lastModified) {
      currentTemplate.lastModified = _newFile.lastModified;
      addTemplateAndRender(_newFile);
    }
  }, 1000);
}

// fastest way to check if an object is mepty
function isObjectEmpty (obj) {
  for (var i in obj) {
    return false;
  }
  return true;
}
// use Carbone debug feature to generate data from template
function generateFakeDataIfEmpty (fakeData, fakeComplement) {
  if  ( (!carboneRenderObj.data    || isObjectEmpty(carboneRenderObj.data)    === true)
    &&  (!carboneRenderObj.options || isObjectEmpty(carboneRenderObj.options) === true) ) {
    carboneRenderObj.data = fakeData;
    carboneRenderObj.complement = fakeComplement;
    editor.set(carboneRenderObj[codeEditor.activePan]);
  }
}

// This function is used directly in html to change panel (enum, data, complement, etc...)
// eslint-disable-next-line
function changePan (newPanNode, newActiveEditorPan) {
  if (codeEditor.activePan === newActiveEditorPan) {
    return;
  }
  if (isJsonValid() === false) {
    setConsoleMessage('error', 'Fix JSON to change pan');
    return;
  }
  carboneRenderObj[codeEditor.activePan] = editor.get();
  codeEditor.prevActiveTabDOM.classList.remove('active');

  editor.set(carboneRenderObj[newActiveEditorPan]);
  newPanNode.classList.add('active');

  codeEditor.prevActiveTabDOM = newPanNode;
  codeEditor.activePan = newActiveEditorPan;
}

async function addTemplateAndRender (file) {
  if (!file) {
    // onChange event, the file can be empty at first click in Firefox
    return;
  }
  setConsoleMessage('info', 'Uploading template...');
  const result = await addTemplate(file);

  if (result.success) {
    currentTemplate.id = result.data.templateId;
    setContent('filename', `${file.name} (live editing)`);
    setConsoleMessage('success', 'Template added');
    refreshRender();
  }
  else {
    setConsoleMessage('error', data.error);
  }
}

async function refreshRender () {
  if (isJsonValid() === false || currentTemplate.id.length === 0) {
    return;
  }

  setConsoleMessage('info', 'Rendering template...');
  const result = await renderReport(currentTemplate.id, carboneRenderObj);

  if (result.success) {
    const _url = `${carboneConfig.apiUrl}/render/${result.data.renderId}`;
    if (result.data.debug && result.data.debug.sample) {
      generateFakeDataIfEmpty(result.data.debug.sample.data, result.data.debug.sample.complement);
    }
    // direct preview in browser if pdf
    if (carboneRenderObj.convertTo === 'pdf') {
      pdfviewer.data = _url;
    }
    else {
      // force file download
      fetch(_url)
        .then( res => res.blob() )
        .then( blob => {
          let file = window.URL.createObjectURL(blob);
          window.location.assign(file);
        });
      // empty right window for better UX
      pdfviewer.data = '';
    }
    setConsoleMessage('success', 'Template rendered');
  }
  else {
    setConsoleMessage('error', result.error);
  }
  console.log(result);
}

async function addTemplate (file, payload = '') {
  const form = new FormData();
  if (!file) {
    throw new Error('The file argument is not valid');
  }
  form.append('payload', payload);
  form.append('template', file);
  const response = await fetch(`${carboneConfig.apiUrl}/template`, {
    method  : 'post',
    body    : form,
    headers : {
      'carbone-version' : carboneConfig.apiVersion,
      'x-from-proxy'    : true
    },
  });
  return await response.json();
}

async function renderReport (templateId, data) {
  if (!templateId) {
    throw new Error('Cannot render report, template is not valid');
  }
  if (!data) {
    throw new Error('Cannot render report, data is not valid');
  }
  const response = await fetch(`${carboneConfig.apiUrl}/render/${templateId}`, {
    method  : 'post',
    body    : JSON.stringify(data),
    headers : {
      'Content-type'    : 'application/json',
      'carbone-version' : carboneConfig.apiVersion,
      'x-from-proxy'    : true
    },
  });
  return await response.json();
}

function setContent (id, value) {
  document.getElementById(id).innerHTML = value;
}

function setConsoleMessage (type, message) {
  if (type === 'info') {
    document.getElementById('console-title').innerHTML = 'Info';
    document.getElementById('console-title').style.color = '#4d4dfb';
  }
  else if (type === 'success') {
    document.getElementById('console-title').innerHTML = 'Success';
    document.getElementById('console-title').style.color = '#4ac74f';
  }
  else if (type === 'error') {
    document.getElementById('console-title').innerHTML = 'Error';
    document.getElementById('console-title').style.color = '#fb4d4d';
  }
  document.getElementById('console-content').innerHTML = message;
}

function isJsonValid () {
  try {
    editor.get();
    if (currentTemplate.id.length === 0) {
      setConsoleMessage('info', 'Upload a template to render it');
    }
    return true;
  }
  catch (e) {
    setConsoleMessage('error', 'Invalid JSON');
    return false;
  }
}

setConsoleMessage('info', 'Upload a template to start using the studio');

// eslint-disable-next-line
const toolBar = {
  changeLang : (e) => {
    event.stopPropagation();
    carboneRenderObj.lang = e.value;
    refreshRender();
  },
  changeConvertTo : (e) => {
    event.stopPropagation();
    carboneRenderObj.convertTo = e.value;
    refreshRender();
  }
};