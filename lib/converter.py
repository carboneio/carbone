import os
import sys
import argparse
import uno, unohelper
import time
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
parser = argparse.ArgumentParser()
parser.add_argument("-p", "--pipe")
parser.add_argument("-i", "--input")
parser.add_argument("-o", "--output")
parser.add_argument("-f", "--format")


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
    sys.exit(101) # Existing listener not found. Unable start listener by parameters. Aborting.


def convert(message):
    ### Parse the message 
    messageSplit = message.split()
    fileOption = parser.parse_args(args=messageSplit)

    document = None
    inputprops = UnoProps(Hidden=True, ReadOnly=True, UpdateDocMode=QUIET_UPDATE)
    cwd = unohelper.systemPathToFileUrl( os.getcwd() )
    inputurl = unohelper.absolutize(cwd, unohelper.systemPathToFileUrl(fileOption.input))
    document = desktop.loadComponentFromURL( inputurl , "_blank", 0, inputprops)

    if not document:
        sys.exit(102) # The document could not be opened.

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
    outputurl = unohelper.absolutize(cwd, unohelper.systemPathToFileUrl(fileOption.output) )
    document.storeToURL(outputurl, tuple(outputprops) )

    document.dispose()
    document.close(True)
    send('END')


def listen():
    while True:
      message = sys.stdin.readline()
      if message:
        convert(message)
      else: # an empty line means stdin has been closed
        exit(0)



### parse arguments
initParams = parser.parse_args()

### Connection to LibreOffice
connectionStr = "pipe,name=%s;urp;StarOffice.ComponentContext" % (initParams.pipe)
context = uno.getComponentContext()
svcmgr = context.ServiceManager
resolver = svcmgr.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", context)

### Try to open a connection with LibreOffice
for retry in retryloop(attempts=10, timeout=10, delay=1):
    try:
        unocontext = resolver.resolve("uno:%s" % connectionStr)
    except NoConnectException:
        retry()

### Check that everything is ok
if not unocontext:
  sys.exit(101) # Unable to connect or start own listener. Aborting.

### And some more LibreOffice magic
unosvcmgr = unocontext.ServiceManager
desktop = unosvcmgr.createInstanceWithContext("com.sun.star.frame.Desktop", unocontext)

### Send Ready signal to NodeJS and listen for document conversion
send('READY')
listen()


