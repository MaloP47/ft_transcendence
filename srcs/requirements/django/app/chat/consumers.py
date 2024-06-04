import json
import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from datetime import date
from website.models import User
from asgiref.sync import sync_to_async

class ChatConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.room_name = 'chat'
		self.room_group_name = 'chat_%s' % self.room_name

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)

		userId = self.scope['user'].id
		results = await sync_to_async(User.objects.get, thread_sensitive=True)(id=userId)
		results.online = True
		await sync_to_async(results.save)()
		await self.accept()

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)

		userId = self.scope['user'].id
		results = await sync_to_async(User.objects.get, thread_sensitive=True)(id=userId)
		results.online = False
		await sync_to_async(results.save)()

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json['message']
		username = self.scope['user'].username

		print(username);
		print(message);
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'chat_message',
				'message': message,
				'user': username,
				'timestamp': str(date.today())
			}
		)

	async def chat_message(self, event):
		message = event['message']
		username = event['user']
		timestamp = event['timestamp']
		
		# Envoyer le message au WebSocket
		await self.send(text_data=json.dumps({
			'message': message,
			'user': {'username': username},
			'timestamp': timestamp,
		}))
