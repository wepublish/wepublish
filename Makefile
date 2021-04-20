setup-dev-environment:
	docker-compose -f docker-compose.dev.yml run --no-deps peer-a yarn install --frozen-lockfile
	docker-compose -f docker-compose.dev.yml run --no-deps peer-a yarn build

install:
	docker-compose -f docker-compose.dev.yml run --no-deps peer-a yarn install

sh:
	docker-compose -f docker-compose.dev.yml run --no-deps peer-a sh	

dev:
	docker-compose -f docker-compose.dev.yml up peer-a mongo mongo-express

dev-peer:
	docker-compose -f docker-compose.dev.yml up

dump-local-data:
	docker exec -it mongo sh /tmp/data/dump-mongo.sh wepublish /tmp/data/default-mongo.gz
	docker exec -it mongo sh /tmp/data/dump-mongo.sh wepublish-peer /tmp/data/default-mongo-peer.gz
	docker exec -it peer-a cp -R ./examples/media/.media ./data

import-local-data:
	docker exec -it mongo sh /tmp/data/import-mongo.sh /tmp/data/default-mongo.gz wepublish
	docker exec -it mongo sh /tmp/data/import-mongo.sh /tmp/data/default-mongo-peer.gz wepublish-peer
	docker exec -it peer-a cp -R ./data/.media ./examples/media/