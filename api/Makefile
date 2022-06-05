docker:
	docker build -t local/meting-api-server . --squash
	docker tag "local/meting-api-server" "metowolf/meting:1.5.11"

publish:
	docker push metowolf/meting:1.5.11