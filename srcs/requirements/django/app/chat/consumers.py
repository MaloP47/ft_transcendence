import json
from datetime import datetime
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
		try:
			friendRequest = text_data_json['friendRequest']
			await self.channel_layer.group_send(
				self.room_group_name,
				{
					'type': 'friend_request',
					'id': friendRequest,
					'from': self.scope['user'].id,
				}
			)
		except:
			pass
		try:
			updateFriends = text_data_json['updateFriends']
			await self.channel_layer.group_send(self.room_group_name, {'type': 'need_update'})
		except:
			pass
		try:
			new_message = text_data_json['message']
			username = self.scope['user'].username
			userId = self.scope['user'].id
			roomId = text_data_json['room']
			rooms = await sync_to_async(Room.objects.all, thread_sensitive=True)()
			count = await sync_to_async(rooms.count)()
			if (count == 0):
				new_room = Room(publicRoom=True)
				await sync_to_async(new_room.save)()
			if roomId == "Public":
				room = await sync_to_async(Room.objects.get, thread_sensitive=True)(publicRoom=True)
			else:
				room = await sync_to_async(Room.objects.get, thread_sensitive=True)(id=roomId)
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
					'roomId': roomId,
					'timestamp': new.date.strftime('%Y-%m-%d %I:%M %p'),
				}
			)
		except:
			pass

	async def chat_message(self, event):
		message = event['message']
		username = event['user']
		id = event['id']
		timestamp = event['timestamp']
		# Envoyer le message au WebSocket
		await self.send(text_data=json.dumps({
			'message': message,
			'user': {'username': username, 'id': id},
			'roomId': event['roomId'],
			'timestamp': timestamp,
		}))

	async def need_update(self, event):
		await self.send(text_data=json.dumps({
			'need_update': True,
		}))

	async def friend_request(self, event):
		await self.send(text_data=json.dumps({
			'friendRequest': event['id'],
			'from': event['from'],
		}))

	async def updateOnline(self, online):
		userId = self.scope['user'].id
		results = await sync_to_async(User.objects.get, thread_sensitive=True)(id=userId)
		results.online = online
		results.last_login = datetime.now()
		await sync_to_async(results.save)()
		await self.channel_layer.group_send(self.room_group_name, {'type': 'need_update'})
