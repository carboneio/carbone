#!/bin/bash

# Accepts these external variables
# NON_INTERACTIVE    : false by default. Set true to run this script without interaction
# CARBONE_WORKDIR    : installation directory
# CARBONE_USER       : carbone user

reset=$(tput sgr0)
red=$(tput setaf 9)
green=$(tput setaf 76)
gray=$(tput setaf 7)

print_info() {
  printf "${gray}%s${reset}" "$@"
}
print_success() {
  printf "${green}✔ %s${reset}\n" "$@"
}
print_error() {
  printf "${red}%s${reset}\n" "$@"
}
exit_on_command_error() {
  if [ "$?" != "0" ]; then
    print_error "ERROR:"
    printf "${red}%s${reset}\n" "$@"
    echo ""
    echo "Installation stopped"
    exit 1
  fi
}

echo "Installing Carbone"
echo "=================="

if [ `whoami` != root ]; then
  print_error "Please run this script as root or using sudo"
  exit 1
fi

while (( $# )); do
  case "$1" in
    --non-interactive) NON_INTERACTIVE=true ;;
    --no-start) NO_START=true ;;
    *)
    break ;;
  esac
  shift
done

# Replace "sed" command by an OS specific command "sed_i". Why?
# The GNU version of sed allows you to use "-i" without an argument. The FreeBSD/Mac OS X does not.
# Source: http://www.grymoire.com/Unix/Sed.html#uh-62h
case $(sed --help 2>&1) in
  *GNU*) sed_i () { 
    sed -i "$@";
    exit_on_command_error "Cannot execute sed with $@"
  };;
  *) sed_i () { 
    sed -i '' "$@"; 
    exit_on_command_error "Cannot execute sed with $@"
  };;
esac

# Assign variables if not already defined
CARBONE_USER=${CARBONE_USER:="carbone"}
CARBONE_WORKDIR=${CARBONE_WORKDIR:="/var/www/carbone-ee"}

if [ ! "$NON_INTERACTIVE" = true ]; then
  echo ""
  echo "Carbone installation, data and configuration directory"
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
SYSTEMD_TEMPLATE="$(dirname "$BINARY_FILE_PATH")/systemd"
SYSTEMD_SERVICE_PATH="/etc/systemd/system/${CARBONE_SERVICE_NAME}.service"

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
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation stopped!"
    exit 1
  fi
  echo ""
fi

if systemctl is-active --quiet $CARBONE_SERVICE_NAME; then
  print_info "Stopping current Carbone service "
  systemctl stop $CARBONE_SERVICE_NAME
  exit_on_command_error "Cannot stop current Carbone service"
  print_success "OK"
fi

if id $CARBONE_USER &>/dev/null; then
  print_info "User $CARBONE_USER already exists "
  print_success "OK"
else
  print_info "Create carbone user "
  adduser $CARBONE_USER --no-create-home --disabled-password --system --group
  exit_on_command_error "Cannot create user $CARBONE_USER"
  print_success "OK"
fi

if [ ! -d $CARBONE_WORKDIR ]; then
  print_info "Create Carbone directory "
  mkdir $CARBONE_WORKDIR
  exit_on_command_error "Cannot create directory in $CARBONE_WORKDIR. Is parent directory exist?"
  print_success "OK"

  print_info "Set directory owner to carbone "
  chown -R $CARBONE_USER:$CARBONE_USER $CARBONE_WORKDIR
  exit_on_command_error "Cannot change owner of directory $CARBONE_WORKDIR"
  print_success "OK"
fi

if [ $BINARY_FILE_PATH != $CARBONE_BIN_PATH ]; then
  print_info "Copy binary in carbone directory "
  cp $BINARY_FILE_PATH $CARBONE_WORKDIR
  exit_on_command_error "Cannot copy binary in $CARBONE_WORKDIR"
  cd $CARBONE_WORKDIR
  # mv crash if filename are the same
  if [ $BINARY_FILE != $CARBONE_BIN ]; then
    mv $BINARY_FILE $CARBONE_BIN
    exit_on_command_error "Cannot rename binary $BINARY_FILE"
  fi
  chmod 750 $CARBONE_BIN
  exit_on_command_error "Cannot make it executable"
  print_success "OK"
fi

print_info "Change owner of executable "
chown $CARBONE_USER:$CARBONE_USER $CARBONE_BIN_PATH
exit_on_command_error "Cannot change owner of $CARBONE_BIN_PATH"
print_success "OK"

print_info "Create $CARBONE_SERVICE_NAME systemd service"
cp $SYSTEMD_TEMPLATE $SYSTEMD_SERVICE_PATH
exit_on_command_error "Cannot copy ${SYSTEMD_TEMPLATE} to ${SYSTEMD_SERVICE_PATH}. Execute 'carbone-ee install' again if ${SYSTEMD_TEMPLATE} does not exit."
print_success "OK"

# Replace path in systemd
print_info "Update $CARBONE_SERVICE_NAME systemd file "
sed_i "s/CARBONE_SERVICE_NAME/$CARBONE_SERVICE_NAME/" "$SYSTEMD_SERVICE_PATH"
# Use "@" instead of "/"" because CARBONE_WORKDIR contains slashes
sed_i "s@CARBONE_WORKDIR@$CARBONE_WORKDIR@" "$SYSTEMD_SERVICE_PATH"
sed_i "s/CARBONE_USER/$CARBONE_USER/" "$SYSTEMD_SERVICE_PATH"
sed_i "s@CARBONE_BIN_PATH@$CARBONE_BIN_PATH@" "$SYSTEMD_SERVICE_PATH"
print_success "OK"

print_info "Register service "
systemctl daemon-reload > /dev/null 2>&1
systemctl enable $CARBONE_SERVICE_NAME
exit_on_command_error "Cannot reload or enable service $CARBONE_SERVICE_NAME"
print_success "OK"
if [ ! "$NO_START" = true ]; then
  print_info "Starting service "
  systemctl start $CARBONE_SERVICE_NAME
  print_success "OK"
fi

echo ""
echo "Installation done!"
echo ""
echo "Run sudo 'systemctl stop/start $CARBONE_SERVICE_NAME' to start/stop Carbone"
echo "Run sudo 'journalctl -f -u $CARBONE_SERVICE_NAME' to see logs"
