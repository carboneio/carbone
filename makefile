test:
	./node_modules/.bin/mocha --growl -u bdd -t 10000 -R landing -w -b

.PHONY: test