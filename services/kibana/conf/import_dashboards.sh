#!/bin/bash

# Démarrer Kibana en arrière-plan
exec kibana


# Attendre que Kibana soit prêt
while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' localhost:5601/api/status)" != "200" ]]; do 
	echo "Waiting for Kibana to be available..."
	sleep 5
done

# Vérifier si l'index pattern existe déjà
if curl -s -X GET "localhost:5601/api/saved_objects/_find?type=index-pattern&search=filebeat-*&search_fields=title" | grep -q '"total":0'; then
	# Ajouter l'index pattern
	curl -X POST "localhost:5601/api/saved_objects/index-pattern" \
		-H 'Content-Type: application/json' \
		-H 'kbn-xsrf: true' \
		-d '{"attributes":{"title":"filebeat-*","timeFieldName":"@timestamp"}}'
	echo "Index pattern 'filebeat-*' added."
else
	echo "Index pattern 'filebeat-*' already exists."
fi
