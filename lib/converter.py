
#inputFile = 'python/test.odt'
#connection = "pipe,name=bla;urp;StarOffice.ComponentContext"
#outputFormat = 'writer_pdf_Export'

import os
import sys
import uno, unohelper
from com.sun.star.beans import PropertyValue
from com.sun.star.connection import NoConnectException
from com.sun.star.document.UpdateDocMode import QUIET_UPDATE
from com.sun.star.lang import DisposedException, IllegalArgumentException
from com.sun.star.io import IOException, XOutputStream
from com.sun.star.script import CannotConvertException
from com.sun.star.uno import Exception as UnoException
from com.sun.star.uno import RuntimeException

import argparse

# parse arguments
parser = argparse.ArgumentParser()
parser.add_argument("-pipe", "--pipe")
parser.add_argument("-file", "--file")
parser.add_argument("-format", "--format")
args = parser.parse_args()

inputFile = args.file
connection = "pipe,name=%s;urp;StarOffice.ComponentContext" % (args.pipe)
outputFormat = args.format


### And now that we have those classes, build on them
class OutputStream( unohelper.Base, XOutputStream ):
    def __init__( self ):
        self.closed = 0

    def closeOutput(self):
        self.closed = 1

    def writeBytes( self, seq ):
        sys.stdout.write( seq.value )

    def flush( self ):
        pass

def UnoProps(**args):
    props = []
    for key in args:
        prop = PropertyValue()
        prop.Name = key
        prop.Value = args[key]
        props.append(prop)
    return tuple(props)


try:
    #make stdout binary
    sys.stdout = sys.stdout.detach()

    ##########
    unocontext = None

    ### Do the LibreOffice component dance
    context = uno.getComponentContext()
    svcmgr = context.ServiceManager
    resolver = svcmgr.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", context)

    ### Test for an existing connection
    try:
        unocontext = resolver.resolve("uno:%s" % connection)
    except NoConnectException as e:
        sys.exit(100) # Existing listener not found. Unable start listener by parameters. Aborting.

    if not unocontext:
        sys.exit(101) # Unable to connect or start own listener. Aborting.

    ### And some more LibreOffice magic
    unosvcmgr = unocontext.ServiceManager
    desktop = unosvcmgr.createInstanceWithContext("com.sun.star.frame.Desktop", unocontext)
    cwd = unohelper.systemPathToFileUrl( os.getcwd() )

    document = None
    inputprops = UnoProps(Hidden=True, ReadOnly=True, UpdateDocMode=QUIET_UPDATE)
    inputurl = unohelper.absolutize(cwd, unohelper.systemPathToFileUrl(inputFile))
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

    outputprops = UnoProps(FilterName=outputFormat, OutputStream=OutputStream(), Overwrite=True)
    outputurl = "private:stream"

    document.storeToURL(outputurl, tuple(outputprops) )

    document.dispose()
    document.close(True)

# (SystemError,RuntimeException,DisposedException,IllegalArgumentException,IOException,CannotConvertException,UnoException)
except Exception as e:
    sys.exit(1)

sys.exit(0)
