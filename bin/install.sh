echo "Installing Carbone..."
echo "====================="

BINARY_FILE_PATH=$1
BINARY_FILE="$(basename -- $BINARY_FILE_PATH)"

CARBONE_WORKDIR="/var/www/carbone-ee"
CARBONE_BIN="carbone-ee"
CARBONE_BIN_PATH="$CARBONE_WORKDIR/$CARBONE_BIN"
CARBONE_USER="carbone"

echo "CARBONE_WORKDIR  = $CARBONE_WORKDIR"
echo "CARBONE_BIN      = $CARBONE_BIN"
echo "CARBONE_BIN_PATH = $CARBONE_BIN_PATH"
echo "CARBONE_USER     = $CARBONE_USER"
echo "====================="

if [ ! -d $CARBONE_WORKDIR ]
then
  echo "Create Carbone directory..."
  mkdir /var/www/
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
  sudo adduser $CARBONE_USER --no-create-home --disabled-password --system --group
  sudo chown -R $CARBONE_USER:$CARBONE_USER $CARBONE_WORKDIR
  echo "Create carbone user and chown...OK"
fi

echo "Register service..."
sudo systemctl daemon-reload > /dev/null 2>&1
sudo systemctl enable $CARBONE_BIN
echo "Register service...OK"
echo "Starting service..."
sudo systemctl start $CARBONE_BIN
echo "Starting service...OK"

echo "Installation done!"
echo "Run sudo systemctl stop/start $CARBONE_BIN to start/stop Carbone"
