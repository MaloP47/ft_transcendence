# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    views.py                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/06/12 14:48:57 by gbrunet           #+#    #+#              #
#    Updated: 2024/06/12 14:59:45 by gbrunet          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth import login, logout, authenticate
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Exists, F, Subquery, OuterRef
from website.models import BlockedUser, User, Message, Room, FriendRequest
import json
from datetime import datetime, timedelta

@csrf_exempt
def index(request):
	return render(request, "website/index.html");

@csrf_exempt
def getUser(request):
	if request.method == 'POST':
		if request.user.is_authenticated:
			return JsonResponse({
				'authenticated': True,
				'username': request.user.username,
				'email': request.user.email,
				'last_login': request.user.last_login,
				'id': request.user.id,
			})
		else:
			return JsonResponse({
				'authenticated': False,
			})

@csrf_exempt
def logoutUser(request):
	if request.method == 'POST':
		if request.user.is_authenticated:
			request.user.online = False;
			request.user.save()
			logout(request);
			return JsonResponse({
				'success': True,
				'needUserUpdate' : True,
			})
	return JsonResponse({
		'success': False,
	})

@csrf_exempt
def signinUser(request):
	if request.method == 'POST':
		if request.user.is_authenticated == False:
			user = authenticate(username=request.POST["username"], password=request.POST["password"])
			if user is not None:
				login(request, user)
				return JsonResponse({ 'success': True, 'username': request.POST["username"] })
			else:
				return JsonResponse({ 'success': False })
	return JsonResponse({
		'success': False,
	})

@csrf_exempt
def searchUser(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		users = User.objects.annotate(
			pending=Subquery(Exists(FriendRequest.objects.exclude(accepted=True).filter(userFrom=request.user).filter(userTo_id=OuterRef("id"))))
		).annotate(
			ask=Subquery(Exists(FriendRequest.objects.filter(userTo=request.user).filter(userFrom_id=OuterRef("id"))))
		).filter(username__icontains=data['search']).annotate(
			block=Subquery(Exists(BlockedUser.objects.filter(userFrom=request.user, userBlocked__id=OuterRef("id"))))
		).filter(username__icontains=data['search']).exclude(id__in=request.user.friends.all())[:8]
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/searchUser.html', {"user": request.user, "users": users}),
		});

@csrf_exempt
def deleteRequest(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		request = FriendRequest.objects.get(userFrom_id=data['from'], userTo=request.user)
		request.delete()
		return JsonResponse({
			'success': True,
		});

@csrf_exempt
def addFriend(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		user = User.objects.get(id=data['id'])
		friendRequest = FriendRequest(userFrom=request.user, userTo=user, accepted=False)
		friendRequest.save()
		return JsonResponse({
			'success': True,
		});

@csrf_exempt
def deleteFriend(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		user = User.objects.get(id=data['id'])
		request.user.friends.remove(user)
		room = Room.objects.filter(users=user).filter(users=request.user)
		room.delete();
		return JsonResponse({
			'success': True,
		});

@csrf_exempt
def unblockUser(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		user = User.objects.get(id=data['id'])
		blockedUser = BlockedUser.objects.get(userFrom=request.user, userBlocked=user)
		blockedUser.delete()
		return JsonResponse({
			'success': True,
		});

@csrf_exempt
def blockUser(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		user = User.objects.get(id=data['id'])
		blockedUser = BlockedUser(userFrom=request.user, userBlocked=user)
		blockedUser.save()
		request.user.friends.remove(user)
		room = Room.objects.filter(users=user).filter(users=request.user)
		room.delete();
		return JsonResponse({
			'success': True,
		});

@csrf_exempt
def acceptFriend(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		user = User.objects.get(id=data['id'])
		request.user.friends.add(user)
		friendRequest = FriendRequest.objects.get(userFrom_id=data['id'], userTo_id=request.user.id)
		friendRequest.delete()
		new_room = Room(publicRoom=False)
		new_room.save()
		new_room.users.add(user)
		new_room.users.add(request.user)
		return JsonResponse({
			'success': True,
		});

@csrf_exempt
def profilMenu(request):
	if request.method == 'POST':
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/profilMenu.html', {"user": request.user}),
		});

@csrf_exempt
def loginForm(request):
	if request.method == 'POST':
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/login.html', {"user": request.user}),
		});

@csrf_exempt
def registerForm(request):
	if request.method == 'POST':
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/register.html'),
		});

@csrf_exempt
def homeView(request):
	if request.method == 'POST':
		if request.user.is_authenticated:
			friendRequest = FriendRequest.objects.filter(userTo=request.user).exclude(accepted=True)
		else:
			friendRequest = []
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/home.html', {"user": request.user, "friendRequest": friendRequest}),
		});

@csrf_exempt
def chatView(request):
	if request.method == 'POST' and request.user.is_authenticated:
		data = json.loads(request.POST["data"]);
		roomName = data['room']
		roomId = "Public"
		friendId = 0
		if (data['room'] == "Public"):
			messages = Message.objects.filter(room__publicRoom=True).filter(date__gte=datetime.now() - timedelta(hours=2)).order_by("date").annotate(block=Subquery(Exists(BlockedUser.objects.filter(userFrom=request.user, userBlocked__id=OuterRef("user_id")))))
		else: 
			messages = Message.objects.filter(room__id=data['room']).order_by("date")
			room = Room.objects.get(id=data['room'])
			roomId = room.id
			for u in room.users.all():
				if u != request.user:
					roomName = u.username
					friendId = u.id
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/chatView.html', {"user": request.user, "messages": messages, "roomName": roomName, "roomId": roomId, "friendId": friendId}),
		});
	else:
		return JsonResponse({
			'success': False,
		});

@csrf_exempt
def chatMenu(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		user = User.objects.get(id=data['id']);
		isFriend = request.user.friends.filter(id=data['id']).exists()
		isBlocked = BlockedUser.objects.filter(userFrom=request.user, userBlocked__id=data['id']).exists()
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/chatMenu.html', {"user": request.user, "isFriend": isFriend, "isBlocked": isBlocked, "for": user}),
		});

@csrf_exempt
def chatUserView(request):
	if request.method == 'POST' and request.user.is_authenticated:
		friends = User.objects.filter(id__in=request.user.friends.all()).annotate(connected=Subquery(Exists(User.objects.filter(id=OuterRef("id")).filter(last_login__gt=datetime.now() - timedelta(minutes=15))))).annotate(live=Subquery(Exists(User.objects.filter(id=OuterRef("id")).filter(online=True).filter(last_login__gt=datetime.now() - timedelta(hours=1)))))
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/chatUserBtn.html', {"user": request.user, "friends": friends}),
		});
	else:
		return JsonResponse({
			'success': False,
		});

@csrf_exempt
def chatRoomsView(request):
	if request.method == 'POST' and request.user.is_authenticated:
		rooms = Room.objects.filter(users=request.user).annotate(unread=Subquery(Exists(Message.objects.filter(room_id=OuterRef("id")).exclude(user=request.user).exclude(read=True))))
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/chatRooms.html', {"user": request.user, "rooms": rooms}),
		});
	else:
		return JsonResponse({
			'success': False,
		});

@csrf_exempt
def chatMessageView(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		friend = User.objects.get(id=data['user']['id'])
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/chatMessageView.html', {"data": data, "user": request.user, "friend": friend}),
		});

@csrf_exempt
def friendRequestView(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		friend = User.objects.get(id=data['from'])
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/friendRequestView.html', {"friend": friend, "user": request.user}),
		});

@csrf_exempt
def messageSetRead(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		room = data['room']
		user = data['user']
		if (room != "Public"):
			Message.objects.filter(room_id=room).filter(user_id=user).exclude(read=True).update(read=True)
		return JsonResponse({
			'success': True,
		});
