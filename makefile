serve:
	go run server/serve.go

test:
	echo todo

login:
	heroku container:login

push:
	heroku container:push -a ink-renderer web

release:
	heroku container:release -a ink-renderer web

deploy: login push release
