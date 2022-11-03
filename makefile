test:
	./node_modules/.bin/mocha -u bdd -t 100000 -w -b --reporter-option maxDiffSize=64632

.PHONY: test