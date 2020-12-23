/* eslint-disable no-undef */

const carboneConfig = {
  apiVersion: 2,
  apiUrl: window.location.origin
}

let templateId = '';
let fileHandle = null;
let file = {};
let filename = '';
let interval = null;
let lastModifiedFile = null;
let timeoutJsonChange = null;
let dataJson = {}
let complementJson = {}
let enumJson = {}
let translationJson = {}
let editorPan = -1
const nativeFileSystemIsActive = 'showOpenFilePicker' in window;

// JSON Editor
const container = document.getElementById('jsoneditor');
const options = {
  onChange : () => {
    if (isJsonValid() === false) {
      return
    }

    if (editorPan === 0) {
      dataJson = editor.get()
    } else if (editorPan === 1) {
      complementJson = editor.get()
    } else if (editorPan === 2) {
      enumJson = editor.get()
    } else if (editorPan === 3) {
      translationJson = editor.get()
    }

    if (timeoutJsonChange !== null) {
      clearTimeout(timeoutJsonChange)
    }

    timeoutJsonChange = setTimeout(() => {
      refreshRender()
    }, 2000)
  },
  enableSort : false,
  enableTransform : false
};
const editor = new JSONEditor(container, options);
const initialJson = {};

editor.setMode('code');
editor.set(initialJson);

// PDF Viewer
const pdfviewer = document.getElementById('pdfviewerobject');

pdfviewer.data = '';

// Template input
const fileInput = document.getElementById('template');

fileInput.addEventListener('click', async (event) => {
  if (nativeFileSystemIsActive) {
    event.preventDefault();
    try {
      [fileHandle] = await window.showOpenFilePicker();
      file = await fileHandle.getFile();
      lastModifiedFile = file.lastModified;

      addTemplateAndRender(file)

      interval = setInterval(async () => {
        let newFile = await fileHandle.getFile()

        if (newFile !== null && newFile.lastModified !== lastModifiedFile) {
          lastModifiedFile = newFile.lastModified
          addTemplateAndRender(newFile)
        }
      }, 1000);
    } catch (e) {
      setConsoleMessage('error', 'Cannot get template ' + e.toString())
    }
  } else {
    addTemplateAndRender(event.target.value)
  }
})

fileInput.addEventListener('change', () => {
  addTemplateAndRender(fileInput.files[0])
});

const dataButton = document.getElementById('data')
const complementButton = document.getElementById('complement')
const enumButton = document.getElementById('enum')
const translationButton = document.getElementById('translations')

dataButton.addEventListener('click', () => {
  changePan(0)
})
complementButton.addEventListener('click', () => {
  changePan(1)
})
enumButton.addEventListener('click', () => {
  changePan(2)
})
translationButton.addEventListener('click', () => {
  changePan(3)
})

function changePan (pan) {
  if (pan === editorPan) {
    return
  }

  if (isJsonValid() === false) {
    setConsoleMessage('error', 'Fix JSON to change pan')
    return
  }

  if (editorPan === 0) {
    dataJson = editor.get()
    dataButton.style.color = '#000000'
  } else if (editorPan === 1) {
    complementJson = editor.get()
    complementButton.style.color = '#000000'
  } else if (editorPan === 2) {
    enumJson = editor.get()
    enumButton.style.color = '#000000'
  } else if (editorPan === 3) {
    translationJson = editor.get()
    translationButton.style.color = '#000000'
  }

  if (pan === 0) {
    editor.set(dataJson)
    dataButton.style.color = '#82369d'
  } else if (pan === 1) {
    editor.set(complementJson)
    complementButton.style.color = '#82369d'
  } else if (pan === 2) {
    editor.set(enumJson)
    enumButton.style.color = '#82369d'
  } else if (pan === 3) {
    editor.set(translationJson)
    translationButton.style.color = '#82369d'
  }
  editorPan = pan
}

async function addTemplateAndRender (file) {
  filename = file.name
  setConsoleMessage('info', 'Uploading template...')
  const result = await addTemplate(file);

  if (result.success) {
    templateId = result.data.templateId
    setContent('filename', `${filename} (live editing)`)
    setConsoleMessage('success', 'Template added')
    refreshRender()
  } else {
    setConsoleMessage('error', data.error)
  }
}

async function refreshRender () {
  if (isJsonValid() === false || templateId.length === 0) {
    return
  }

  const data = {
    data: dataJson,
    complement: complementJson,
    enum: enumJson,
    translations: translationJson,
    convertTo: 'pdf'
  }
  console.log('LALA', data)
  setConsoleMessage('info', 'Rendering template...')
  const result = await renderReport(templateId, data);

  if (result.success) {
    pdfviewer.data = `${carboneConfig.apiUrl}/render/${result.data.renderId}`
    setConsoleMessage('success', 'Template rendered')
  } else {
    setConsoleMessage('error', result.error)
  }
  console.log(result)
}

async function addTemplate (file, payload = '') {
  const form = new FormData();
  if (!file) {
    throw new Error(
      "Carbone SDK addTemplate error: the file argument is not valid."
    );
  }
  form.append("payload", payload);
  form.append("template", file);
  const response = await fetch(`${carboneConfig.apiUrl}/template`, {
    method: "post",
    body: form,
    headers: {
      "carbone-version": carboneConfig.apiVersion,
      'x-from-proxy': true
    },
  });
  return await response.json();
}

async function renderReport (templateId, data) {
  if (!templateId) {
    throw new Error(
      "Carbone SDK renderReport error: the templateId argument is not valid."
    );
  }
  if (!data) {
    throw new Error(
      "Carbone SDK renderReport error: the data argument is not valid."
    );
  }
  const response = await fetch(`${carboneConfig.apiUrl}/render/${templateId}`, {
    method: "post",
    body: JSON.stringify(data),
    headers: {
      "Content-type": "application/json",
      "carbone-version": carboneConfig.apiVersion,
      'x-from-proxy': true
    },
  });
  return await response.json();
}

function setContent(id, value) {
  document.getElementById(id).innerHTML = value;
}

function setConsoleMessage (type, message) {
  if (type === 'info') {
    document.getElementById('console-title').innerHTML = 'Info';
    document.getElementById('console-title').style.color = '#4d4dfb';
  } else if (type === 'success') {
    document.getElementById('console-title').innerHTML = 'Success';
    document.getElementById('console-title').style.color = '#4ac74f';
  } else if (type === 'error') {
    document.getElementById('console-title').innerHTML = 'Error';
    document.getElementById('console-title').style.color = '#fb4d4d';
  }

  document.getElementById('console-content').innerHTML = message;
}

function isJsonValid () {
  try {
    editor.get()

    if (templateId.length === 0) {
      setConsoleMessage('info', 'Upload a template to render it')
    }
    return true
  } catch (e) {
    setConsoleMessage('error', 'Invalid JSON')
    return false
  }
}

changePan(0)
setConsoleMessage('info', 'Upload a template to start using the studio')
