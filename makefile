test:
	./node_modules/.bin/mocha -u bdd -t 100000 -w -b

.PHONY: test