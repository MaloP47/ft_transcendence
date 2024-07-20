#!/bin/bash


/usr/share/elasticsearch/bin/elasticsearch &
ELASTIC_PID=$!

echo "Elasticsearch started with PID $ELASTIC_PID."

Attendre que Elasticsearch soit prêt
until curl -s http://elasticsearch:9200; do
	echo "Waiting for Elasticsearch..."
	sleep 5
done



/usr/share/elasticsearch/bin/elasticsearch-setup-passwords interactive -b <<EOF
DidierDidier
DidierDidier
DidierDidier
DidierDidier
DidierDidier
DidierDidier
DidierDidier
DidierDidier
DidierDidier
DidierDidier
DidierDidier
DidierDidier
EOF

echo "Stopping Elasticsearch with PID $ELASTIC_PID."

kill $ELASTIC_PID

# Attendre que Elasticsearch soit arrêté
wait $ELASTIC_PID

echo "Elasticsearch stopped."

# Vérifier qu'aucun processus Elasticsearch ne reste en cours
ps aux | grep '/usr/share/elasticsearch/bin/' | grep -v grep

echo "Restarting Elasticsearch..."

exec elasticsearch

# exec "$@"
# tail -f /dev/null

# killall elasticsearch

# elasticsearch-reset-password -i -u kibana <<EOF
# DidierDidier
# DidierDidier
# EOF


# bin/elasticsearch-setup-passwords interactive

# Charger les indices, mappings, etc.
# curl -X PUT "http://elasticsearch:9200/filebeat-*" -H 'Content-Type: application/json' -d'
# {
# 	"mappings": {
# 		"properties": {
# 		"@timestamp": { "type": "date" }
# 		# Ajoutez d'autres mappings si nécessaire
# 		}
# 	}
# }
# '




