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
			#self.room_group_name, # here you can create 2 rooms
			self.channel_name
		)
		await ChatConsumer.updateOnline(self, False)

	# This NEEDS to be changed, add a common `type` field or something with value hostGameInfo, gameNotif, friendRequest, etc.
	# And I don't mean the `type` in `group_send`
	# This might cause severe lag, not sure, basically there's a way to avoid all these try except easily
	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		# Multiplayer logic --v
		if 'type' in text_data_json:
			if text_data_json['type'] == 'multiDataHost': 
				await self.channel_layer.group_send(self.room_group_name, text_data_json) # add url multi/<room_id> to room_group_name
			if text_data_json['type'] == 'multiDataGuest': 
				await self.channel_layer.group_send(self.room_group_name, text_data_json)
			# add if text_data_json['type'] == 'gameNotif':
		else:
			print('No type field in received data')

		# Multiplayer logic --^
		# la partie qui va pas --v
		try:
			gameNotif = text_data_json['gameNotif']
			p1 = text_data_json['p1']
			p2 = text_data_json['p2']
			print(p1)
			print(p2)
			await self.channel_layer.group_send(
				self.room_group_name,
				{
					'type': 'game_notif',
					'id': gameNotif,
					'p1': p1,
					'p2': p2,
				}
			)
		except:
			pass
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
			if roomId == "Public":
				room = await sync_to_async(Room.objects.get, thread_sensitive=True)(id=1)
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

	async def multiDataHost(self, event):
		await self.send(text_data=json.dumps(event))
	async def multiDataGuest(self, event):
		await self.send(text_data=json.dumps(event))

	#async def host_game_info(self, event):
	#	hostGameInfo = event['hostGameInfo']
	#	ballpos = event['ballpos']
	#	await self.send(text_data=json.dumps({
	#		'hostGameInfo': hostGameInfo,
	#		'ballpos': ballpos,
	#	}))

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

	async def game_notif(self, event):
		await self.send(text_data=json.dumps({
			'game_notif': event['id'],
			'p1': event['p1'],
			'p2': event['p2'],
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
