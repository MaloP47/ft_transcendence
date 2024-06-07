# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    views.py                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/06/07 10:56:12 by gbrunet           #+#    #+#              #
#    Updated: 2024/06/07 16:22:27 by gbrunet          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from datetime import timedelta
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth import login, logout, authenticate
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Exists, F, Subquery, OuterRef
from website.models import User, Message, Room, FriendRequest
import json
from datetime import datetime

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
def acceptFriend(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		user = User.objects.get(id=data['id'])
		request.user.friends.add(user)
		request = FriendRequest.objects.get(userFrom_id=data['id'], userTo_id=request.user.id)
		request.accepted=True
		request.save()
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
		friendRequest = FriendRequest.objects.filter(userTo=request.user).exclude(accepted=True)
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/home.html', {"user": request.user, "friendRequest": friendRequest}),
		});

@csrf_exempt
def chatView(request):
	if request.method == 'POST':
		messages = Message.objects.filter(room__publicRoom=True).filter(date__gte=datetime.now() - timedelta(hours=2)).order_by("date")
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/chatView.html', {"user": request.user, "messages": messages}),
		});

@csrf_exempt
def chatUserView(request):
	if request.method == 'POST':
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/chatUserBtn.html', {"user": request.user}),
		});

@csrf_exempt
def chatMessageView(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/chatMessageView.html', {"data": data, "user": request.user}),
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
