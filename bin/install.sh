#!/bin/bash

echo "Installing Carbone"
echo "=================="

if [ `whoami` != root ]; then
  echo "Please run this script as root or using sudo"
  exit
fi

while (( $# )); do
  case "$1" in
    --non-interactive)
      NON_INTERACTIVE=true ;;
    *)
    break ;;
  esac
  shift
done

# Replace "sed" command by an OS specific command "sed_i". Why?
# The GNU version of sed allows you to use "-i" without an argument. The FreeBSD/Mac OS X does not.
# Source: http://www.grymoire.com/Unix/Sed.html#uh-62h
case $(sed --help 2>&1) in
  *GNU*) sed_i () { sed -i "$@"; };;
  *) sed_i () { sed -i '' "$@"; };;
esac


CARBONE_USER=${CARBONE_USER:="carbone"}
CARBONE_WORKDIR=${CARBONE_WORKDIR:="/var/www/carbone-ee"}

if [ ! "$NON_INTERACTIVE" = true ]; then
  echo ""
  echo "Carbone data and configuration storage directory"
  read -p "CARBONE_WORKDIR [$CARBONE_WORKDIR]: "
  if [ ! -z "$REPLY" ]; then
    CARBONE_WORKDIR=$REPLY
  fi
  echo ""
  echo "Carbone will be run as user/group"
  read -p "CARBONE_USER [$CARBONE_USER]: "
  if [ ! -z "$REPLY" ]; then
    CARBONE_USER=$REPLY
  fi
fi

# __SOURCE_BINARY_FILE__ is replaced before using this script
BINARY_FILE_PATH="__SOURCE_BINARY_FILE__"
BINARY_FILE="$(basename -- $BINARY_FILE_PATH)"
CARBONE_BIN="carbone-ee"
CARBONE_BIN_PATH="$CARBONE_WORKDIR/$CARBONE_BIN"
CARBONE_SERVICE_NAME=$CARBONE_BIN
SYSTEMD_TEMPLATE=$BINARY_FILE_PATH/systemd

echo ""
echo "==================================="
echo "CARBONE_WORKDIR      = $CARBONE_WORKDIR"
echo "CARBONE_USER         = $CARBONE_USER"
echo "CARBONE_BIN          = $CARBONE_BIN"
echo "CARBONE_BIN_PATH     = $CARBONE_BIN_PATH"
echo "CARBONE_SERVICE_NAME = $CARBONE_SERVICE_NAME"
echo "==================================="
echo ""


if [ ! "$NON_INTERACTIVE" = true ]; then
  read -p "Confirm installation? (y, n=default) " -r
  if [[ ! $REPLY =~ ^[Yy]$ ]]
  then
    echo 'Installation stopped!'
    exit 1
  fi
fi


if [ ! -d $CARBONE_WORKDIR ]
then
  echo "Create Carbone directory..."
  mkdir $CARBONE_WORKDIR
  echo "Create carbone directory...OK"
fi

if [ $BINARY_FILE_PATH != $CARBONE_BIN_PATH ]; then
  echo "Copy binary in carbone directory..."
  cp $BINARY_FILE_PATH $CARBONE_WORKDIR
  cd $CARBONE_WORKDIR
  mv $BINARY_FILE $CARBONE_BIN
  chmod +x $CARBONE_BIN
  echo "Copy binary in carbone directory...OK"
fi

if id $CARBONE_USER &>/dev/null; then
  echo "User $CARBONE_USER already exists"
else
  echo "Create carbone user and chown..."
  adduser $CARBONE_USER --no-create-home --disabled-password --system --group
  chown -R $CARBONE_USER:$CARBONE_USER $CARBONE_WORKDIR
  echo "Create carbone user and chown...OK"
fi


# Replace path in systemd template
echo "Prepare $CARBONE_SERVICE_NAME systemd file..."
sed_i "s/CARBONE_SERVICE_NAME/$CARBONE_SERVICE_NAME/" "$SYSTEMD_TEMPLATE"
sed_i "s/CARBONE_WORKDIR/$CARBONE_WORKDIR/" "$SYSTEMD_TEMPLATE"
sed_i "s/CARBONE_USER/$CARBONE_USER/" "$SYSTEMD_TEMPLATE"
sed_i "s/CARBONE_BIN_PATH/$CARBONE_BIN_PATH/" "$SYSTEMD_TEMPLATE"
echo "Prepare $CARBONE_SERVICE_NAME systemd file...OK"

echo "Create $CARBONE_SERVICE_NAME service file in /etc/systemd/system..."
mv $BINARY_FILE_PATH/systemd /etc/systemd/system/${CARBONE_SERVICE_NAME}.service
echo "Create $CARBONE_SERVICE_NAME service file in /etc/systemd/system...OK"

echo "Register service..."
systemctl daemon-reload > /dev/null 2>&1
systemctl enable $CARBONE_SERVICE_NAME
echo "Register service...OK"
echo "Starting service..."
systemctl start $CARBONE_SERVICE_NAME
echo "Starting service...OK"

echo ""
echo "Installation done!"
echo ""
echo "Run sudo systemctl stop/start $CARBONE_SERVICE_NAME to start/stop Carbone"
echo "Run sudo journalctl -u $CARBONE_SERVICE_NAME to see logs"
