import os
import sys
import argparse
import uno, unohelper
import time
import shlex
from com.sun.star.beans import PropertyValue
from com.sun.star.connection import NoConnectException
from com.sun.star.document.UpdateDocMode import QUIET_UPDATE
from com.sun.star.lang import DisposedException, IllegalArgumentException
from com.sun.star.io import IOException, XOutputStream
from com.sun.star.script import CannotConvertException
from com.sun.star.uno import Exception as UnoException
from com.sun.star.uno import RuntimeException


desktop = None
unocontext = None
nbConsecutiveAttemptOpeningDocument = 0
nbConsecutiveAttemptOpeningDocumentMax = 10
parser = argparse.ArgumentParser()
parser.add_argument("-p", "--pipe")
parser.add_argument("-i", "--input")
parser.add_argument("-o", "--output")
parser.add_argument("-f", "--format")
parser.add_argument("-fo", "--formatOptions")


def UnoProps(**args):
    props = []
    for key in args:
        prop = PropertyValue()
        prop.Name = key
        prop.Value = args[key]
        props.append(prop)
    return tuple(props)


def send(message):
    sys.stdout.write(message)
    sys.stdout.flush()


def sendErrorOrExit(code):
    ### Tell to python that we want to modify the global variable
    global nbConsecutiveAttemptOpeningDocument
    nbConsecutiveAttemptOpeningDocument += 1
    if nbConsecutiveAttemptOpeningDocument < nbConsecutiveAttemptOpeningDocumentMax:
        send(code)  # The document could not be opened.
    else:
        nbConsecutiveAttemptOpeningDocument = 0
        sys.exit(254) # Restart everything


def retryloop(attempts, timeout, delay=1):
    starttime = time.time()
    success = set()
    for i in range(attempts):
        success.add(True)
        yield success.clear
        if success:
            return
        duration = time.time() - starttime
        if duration > timeout:
            break
        time.sleep(delay)
    sys.exit(253) # Existing listener not found. Unable start listener by parameters. Aborting.


def convert(message):
    global nbConsecutiveAttemptOpeningDocument
    ### Parse the message
    messageSplit = shlex.split(message)
    fileOption = parser.parse_args(args=messageSplit)

    document = None
    inputprops = UnoProps(Hidden=True, ReadOnly=True, UpdateDocMode=QUIET_UPDATE)
    cwd = unohelper.systemPathToFileUrl( os.getcwd() )
    inputurl = unohelper.absolutize(cwd, unohelper.systemPathToFileUrl(fileOption.input))

    try:
        document = desktop.loadComponentFromURL( inputurl , "_blank", 0, inputprops)
    except:
        sendErrorOrExit('400')
        return

    if not document:
        sendErrorOrExit('400')
        return

    ### Reset counter
    nbConsecutiveAttemptOpeningDocument = 0

    ### Update document totals
    try:
        document.calculateAll()
    except AttributeError:
        # the document doesn't implement the calculateAll interface
        pass

    ### Update document links (update sub-documents)
    try:
        document.updateLinks()
    except AttributeError:
        # the document doesn't implement the XLinkUpdate interface
        pass

    ### Update document indexes
    try:
        document.refresh()
        indexes = document.getDocumentIndexes()
    except AttributeError:
        # the document doesn't implement the XRefreshable and/or
        # XDocumentIndexesSupplier interfaces
        pass
    else:
        for i in range(0, indexes.getCount()):
            indexes.getByIndex(i).update()

    outputprops = UnoProps(FilterName=fileOption.format, Overwrite=True)
    if fileOption.formatOptions != '':
        outputprops += UnoProps(FilterOptions=fileOption.formatOptions)
    outputurl = unohelper.absolutize(cwd, unohelper.systemPathToFileUrl(fileOption.output) )

    try:
        document.storeToURL(outputurl, tuple(outputprops) )
    except:
        sendErrorOrExit('401') # could not convert document
        document.dispose()
        document.close(True)
        return

    document.dispose()
    document.close(True)
    send('200') ### Document converted


def listen():
    while True:
      message = sys.stdin.readline()
      if message:
        convert(message)
      else: # an empty line means stdin has been closed
        exit(0)


try:

  ### parse arguments
  initParams = parser.parse_args()

  ### Connection to LibreOffice
  connectionStr = "pipe,name=%s;urp;StarOffice.ComponentContext" % (initParams.pipe)
  context = uno.getComponentContext()
  svcmgr = context.ServiceManager
  resolver = svcmgr.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", context)

  ### Try to open a connection with LibreOffice. Let 60 seconds to start LibreOffice before restarting it.
  for retry in retryloop(attempts=60, timeout=60, delay=1):
      try:
          unocontext = resolver.resolve("uno:%s" % connectionStr)
      except NoConnectException:
          retry()

  ### Check that everything is ok
  if not unocontext:
      sys.exit(255) # Unable to connect or start own listener. Aborting.

  ### And some more LibreOffice magic
  unosvcmgr = unocontext.ServiceManager
  desktop = unosvcmgr.createInstanceWithContext("com.sun.star.frame.Desktop", unocontext)

  ### Send Ready signal to NodeJS and listen for document conversion
  send('204')

  listen()

  ## Catch exit exception to avoid backtrace
except KeyboardInterrupt:
  try:
    sys.exit(0)
  except SystemExit:
    os._exit(0)


