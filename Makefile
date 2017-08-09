.PHONY: all start lint prod clean

# runs with `make`
all: start lint


# run with `make start`
start: node_modules/
	npm start

# run with `make prod`
prod: node_modules/
	npm start -- --port 80

# run with `make lint`
lint: node_modules/
	npm run lint

node_modules/:
	npm install
	touch package.json

clean:
	-rm -R node_modules/
