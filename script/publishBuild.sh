#!/bin/bash

# This script builds Carbone Enterprise Version and must be called by npm run publishBuild

# Get current package version
PACKAGE_VERSION=$(cat package.json | grep "version" | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
# Carbone Enterprise Edition tag
CARBONE_EE_TAG="ee-$PACKAGE_VERSION"

# Build target
BUILD_TARGET="node14-linux-x64,node14-macos-x64"

# Build name
PACKAGE_VERSION_WITHOUT_DOT="${PACKAGE_VERSION//./-}"
BUILD_PREFIX="./build/carbone-ee-$PACKAGE_VERSION_WITHOUT_DOT"

##################################################################
# Declaration of commmon stuff
##################################################################

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
  printf "${red}%s${reset}\n\n" "$@"
}
exit_on_command_error() {
  if [ "$?" != "0" ]; then
    print_error "ERROR:"
    printf "${red}%s${reset}\n" "$@"
    echo ""
    echo "Build stopped"
    exit 1
  fi
}

##################################################################
# Check the version is not already published
##################################################################

print_info "Is $PACKAGE_VERSION a new version? "

REPO_STATUS=$(git status --porcelain)
if [[ "$REPO_STATUS" = "" ]]; then
  print_success "OK"
else
  print_error "Error"
  print_error "This version $CARBONE_EE_TAG already exists"
  exit 1
fi

##################################################################
# Check if git push --tags works
##################################################################

print_info "Is 'git push --tags' working on your machine? "

# I think --dry-run does not work with option --tags
git push --tags --dry-run > /dev/null 2>&1
exit_on_command_error "Cannot push --tags"
print_success "OK"

##################################################################
# Update publication date
##################################################################

node script/updatePackage.js
exit_on_command_error "Cannot update package date"

##################################################################
# Build
##################################################################

print_info "Build $BUILD_PREFIX for targets: $BUILD_TARGET... "

pkg -t $BUILD_TARGET -o $BUILD_PREFIX . > /dev/null 2>&1
exit_on_command_error "Cannot build"

print_success "OK"

##################################################################
# Commit date
##################################################################

print_info "Commit date in package.json... "

git add "package.json" > /dev/null
exit_on_command_error "Cannot git add package.json"

git commit -n -m "Save date in package.json" > /dev/null
exit_on_command_error "Cannot commit"

git push > /dev/null 2>&1 #It is strange, for this command I need to redirect stderr to hide git messages
exit_on_command_error "Cannot push"

print_success "OK"

##################################################################
# Tag and push
##################################################################

print_info "Tag version... "

git tag $CARBONE_EE_TAG
git push origin $CARBONE_EE_TAG

print_success "OK"

print_success "Done"
