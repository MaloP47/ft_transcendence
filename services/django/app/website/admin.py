from django.contrib import admin
from website.models import Game, BlockedUser, FriendRequest, User, Room, Message, Tournament

admin.site.register(User)
admin.site.register(Room)
admin.site.register(Message)
admin.site.register(FriendRequest)
admin.site.register(BlockedUser)
admin.site.register(Game)
admin.site.register(Tournament)
