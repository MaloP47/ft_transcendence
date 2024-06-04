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
		await self.accept()	
		await ChatConsumer.updateOnline(self, True)

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)
		await ChatConsumer.updateOnline(self, False)

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json['message']
		username = self.scope['user'].username
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

	async def need_update(self, event):
		users = []
		async for user in User.objects.filter(online=True).order_by('username'):
			users.append({"username": user.username, "id": user.id})
		await self.send(text_data=json.dumps({
			'need_update': True,
			'users': users,
		}))

	async def updateOnline(self, online):
		userId = self.scope['user'].id
		results = await sync_to_async(User.objects.get, thread_sensitive=True)(id=userId)
		results.online = online
		await sync_to_async(results.save)()
		await self.channel_layer.group_send(self.room_group_name, {'type': 'need_update'})
