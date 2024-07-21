#!/bin/bash

# Démarrer Kibana en arrière-plan
echo "Starting Kibana..."

# Démarrer Kibana
/usr/share/kibana/bin/kibana --allow-root &
KIBANA_PID=$!

echo "Kibana started with PID $KIBANA_PID."

Attendre que Kibana soit prêt
while [[ "$(curl -u elastic:DidierDidier -s -o /dev/null -w ''%{http_code}'' localhost:5601/api/status)" != "200" ]]; do 
	echo "Waiting for Kibana to be available..."
	sleep 5
done

if curl -u elastic:DidierDidier -s -X GET "localhost:5601/api/saved_objects/_find?type=index-pattern&search=logs*&search_fields=title" | grep -q '"total":0'; then
	# Ajouter l'index pattern
	curl -u elastic:DidierDidier  -X POST "localhost:5601/api/saved_objects/index-pattern" \
		-H 'Content-Type: application/json' \
		-H 'kbn-xsrf: true' \
		-d '{"attributes":{"title":"logs*","timeFieldName":"@timestamp"}}'
	echo "Index pattern 'logs*' added."
else
	echo "Index pattern 'logs*' already exists."
fi

# Vérifier si le tableau de bord existe déjà
if curl -u elastic:DidierDidier  -s -X GET "localhost:5601/api/saved_objects/_find?type=dashboard&search=Mon-Beau-Tableau" | grep -q '"total":0'; then
	curl -u elastic:DidierDidier -X POST "http://localhost:5601/api/saved_objects/_import?overwrite=true" \
	-H "kbn-xsrf: true" \
	--form file=@/usr/share/kibana/dashboard.ndjson
	echo "Dashboard 'Mon-Beau-Tableau' added."
else
	echo "Dashboard 'My Filebeat Dashboard' already exists."
fi

sleep 5

echo "Stopping Kibana with PID $KIBANA_PID."

kill $KIBANA_PID

# Attendre que Kibana soit arrêté
wait $KIBANA_PID

echo "Kibana stopped."

# Vérifier qu'aucun processus Kibana ne reste en cours
ps aux | grep '/usr/share/kibana/bin/' | grep -v grep

echo "Restarting Kibana..."

# Redémarrer Kibana
exec /usr/share/kibana/bin/kibana --allow-root
