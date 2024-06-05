import json
import time
from time import strftime, localtime
from channels.generic.websocket import AsyncWebsocketConsumer
from datetime import date
from website.models import User, Message, Room
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
		new_message = text_data_json['message']
		username = self.scope['user'].username
		userId = self.scope['user'].id
		rooms = await sync_to_async(Room.objects.all, thread_sensitive=True)()
		count = await sync_to_async(rooms.count)()
		if (count == 0):
			new_room = Room()
			await sync_to_async(new_room.save)()
		room = await sync_to_async(Room.objects.get, thread_sensitive=True)(id=0)
		user = await sync_to_async(User.objects.get, thread_sensitive=True)(id=userId)
		new = Message(message=new_message, room=room, user=user)
		await sync_to_async(new.save)()
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'chat_message',
				'message': new_message,
				'user': username,
				'id': userId,
				'timestamp': strftime('%Y-%m-%d %H:%M', localtime(time.time()))
			}
		)

	async def chat_message(self, event):
		message = event['message']
		username = event['user']
		id = event['id']
		timestamp = event['timestamp']
		# Envoyer le message au WebSocket
		await self.send(text_data=json.dumps({
			'message': message,
			'user': {'username': username, 'id': id},
			'timestamp': timestamp,
		}))

	async def need_update(self, event):
		users = []
		async for user in User.objects.filter(online=True).order_by('username'):
			users.append({"username": user.username, "id": user.id, "profilPictureUrl": user.profilPicture.url})
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
