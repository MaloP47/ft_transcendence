#!/bin/bash

set -a
source .env
set +a

/usr/share/elasticsearch/bin/elasticsearch &
ELASTIC_PID=$!

echo "Elasticsearch started with PID $ELASTIC_PID."

Attendre que Elasticsearch soit prêt
until curl -s http://elasticsearch:9200; do
	echo "Waiting for Elasticsearch..."
	sleep 5
done

echo "Elasticsearch is ready."


echo "Creating user passwords..."

/usr/share/elasticsearch/bin/elasticsearch-setup-passwords interactive -b <<EOF
$ELASTIC_PASSWORD
$ELASTIC_PASSWORD
$ELASTIC_PASSWORD
$ELASTIC_PASSWORD
$ELASTIC_PASSWORD
$ELASTIC_PASSWORD
$ELASTIC_PASSWORD
$ELASTIC_PASSWORD
$ELASTIC_PASSWORD
$ELASTIC_PASSWORD
$ELASTIC_PASSWORD
$ELASTIC_PASSWORD
EOF


echo "Creating index template..."

curl -u $ELASTIC_USERNAME:$ELASTIC_PASSWORD -X PUT "localhost:9200/_ilm/policy/logs_policy" -H 'Content-Type: application/json' -d'
{
	"policy": {
		"phases": {
		"hot": {
			"min_age": "0ms",
			"actions": {
			"rollover": {
				"max_age": "24h",
				"max_size": "50gb"
			}
			}
		},
		"delete": {
			"min_age": "24h",
			"actions": {
			"delete": {}
			}
		}
		}
	}
}
'

echo "Creating index template..."

curl -u $ELASTIC_USERNAME:$ELASTIC_PASSWORD -X PUT "localhost:9200/_index_template/logs_template" -H 'Content-Type: application/json' -d'
{
	"index_patterns": ["logs-*"],
	"template": {
		"settings": {
		"index.lifecycle.name": "logs_policy",
		"index.lifecycle.rollover_alias": "logs"
		},
		"mappings": {
		"properties": {
			"@timestamp": {
			"type": "date"
			}
		}
		}
	}
}
'


exec elasticsearch




