import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message
from django.contrib.auth.models import User

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("chat", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("chat", self.channel_name)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        user = self.scope["user"]

        if user.is_authenticated:
            new_message = Message.objects.create(user=user, content=message)
            await self.channel_layer.group_send(
                "chat",
                {
                    'type': 'chat_message',
                    'message': message,
                    'user': user.username,
                    'timestamp': new_message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                }
            )

    async def chat_message(self, event):
        message = event['message']
        user = event['user']
        timestamp = event['timestamp']

        await self.send(text_data=json.dumps({
            'message': message,
            'user': user,
            'timestamp': timestamp,
        }))
