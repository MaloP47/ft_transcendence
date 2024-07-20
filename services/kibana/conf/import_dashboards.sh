#!/bin/bash

# Démarrer Kibana en arrière-plan
echo "Starting Kibana..."

# exec kibana
/usr/share/kibana/bin/kibana --allow-root &
# exec kibana --allow-root


echo "Kibana started."

# Attendre que Kibana soit prêt
# while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' localhost:5601/api/status)" != "200" ]]; do 
# 	echo "Waiting for Kibana to be available..."
# 	sleep 5
# done

sleep 5;

if curl -s -X GET "localhost:5601/api/saved_objects/_find?type=index-pattern&search=filebeat-*&search_fields=title" | grep -q '"total":0'; then
	# Ajouter l'index pattern
	curl -X POST "localhost:5601/api/saved_objects/index-pattern" \
		-H 'Content-Type: application/json' \
		-H 'kbn-xsrf: true' \
		-d '{"attributes":{"title":"filebeat-*","timeFieldName":"@timestamp"}}'
	echo "Index pattern 'filebeat-*' added."
	# exec kibana --allow-root
else
	echo "Index pattern 'filebeat-*' already exists."
fi

# Vérifier si le tableau de bord existe déjà
if curl -s -X GET "localhost:5601/api/saved_objects/_find?type=dashboard&search=Mon-Beau-Tableau" | grep -q '"total":0'; then
	# curl -X POST "http://localhost:5601/api/saved_objects/_import" -H "kbn-xsrf: true" --form file=@/usr/share/kibana/dashboard.ndjson
	curl -X POST "http://localhost:5601/api/saved_objects/_import?overwrite=true" \
	-H "kbn-xsrf: true" \
	--form file=@/usr/share/kibana/dashboard.ndjson
	echo "Dashboard 'Mon-Beau-Tableau' added."
else
	echo "Dashboard 'My Filebeat Dashboard' already exists."
fi

sleep 5;

echo "kibana status"

# ps aux | grep 'kibana'

ps aux | grep '/usr/share/kibana/bin/'


kill $(ps aux | grep '/usr/share/kibana/bin/' | awk '{print $2}')

echo "Kibana stopped ???"

ps aux | grep 'kibana'

exec kibana --allow-root

# # Vérifier si le tableau de bord existe déjà
# if curl -s -X GET "localhost:5601/api/saved_objects/_find?type=dashboard&search=Mon-Tableau" | grep -q '"total":0'; then
# 	# Importer le tableau de bord
# 	curl -X POST "http://kibana:5601/api/saved_objects/_import" \
# 	-H "kbn-xsrf: true" \
# 	--form file=@/usr/share/kibana/dashboard.json
# else
# 	echo "Dashboard 'My Filebeat Dashboard' already exists."
# fi