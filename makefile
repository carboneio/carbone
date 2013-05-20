test:
	./node_modules/.bin/mocha --growl -u bdd -t 100000 -R landing -w -b

.PHONY: test