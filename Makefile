.PHONY: all start lint

# runs with `make`
all: start lint


# run with `make start`
start:
	npm start

# run with `make lint`
lint:
	npm run lint
