#!/bin/bash

# Attendre que Elasticsearch soit prêt
until curl -s http://elasticsearch:9200; do
echo "Waiting for Elasticsearch..."
sleep 2
done

# Charger les indices, mappings, etc.
curl -X PUT "http://elasticsearch:9200/filebeat-*" -H 'Content-Type: application/json' -d'
{
	"mappings": {
		"properties": {
		"@timestamp": { "type": "date" }
		# Ajoutez d'autres mappings si nécessaire
		}
	}
}
'
