# **************************************************************************** #
#																			   #
#														  :::	   ::::::::    #
#	 views.py											:+:		 :+:	:+:    #
#													  +:+ +:+		  +:+	   #
#	 By: gbrunet <gbrunet@student.42.fr>			+#+  +:+	   +#+		   #
#												  +#+#+#+#+#+	+#+			   #
#	 Created: 2024/06/12 14:48:57 by gbrunet		   #+#	  #+#			   #
#	 Updated: 2024/06/12 14:59:45 by gbrunet		  ###	########.fr		   #
#																			   #
# **************************************************************************** #

from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth import login, logout, authenticate
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Exists, F, Subquery, OuterRef, Q
from website.models import Game, BlockedUser, User, Message, Room, FriendRequest
import json
from datetime import datetime, timedelta
#userCreationForm
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model
from website.forms import CustomUserCreationForm


def index(request):
	return render(request, "website/index.html");

def indexGame(request, game_id):
	return render(request, "website/index.html");

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

def gameForfeit(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"])
		game = Game.objects.get(id=data['id'])
		game.forfeit = request.user
		game.save()
		return JsonResponse({
			'success': True,
		})

def saveGame(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"])
		game = Game.objects.get(id=data['id'])
		game.p1Score = data['p1']
		game.p2Score = data['p2']
		game.save()
		return JsonResponse({
			'success': True,
		})

def getGame(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		try:
			game = Game.objects.get(id=data['id'])
		except:
			return JsonResponse({'success': False})
		p1Id = -1
		p1Username = ""
		p2Id = -1
		p2Username = ""
		if game.p1:
			p1Id = game.p1.id
			p1Username = game.p1.username
		if game.p2:
			p2Id = game.p2.id
			p2Username = game.p2.username
		if game.p1 == request.user or game.p2 == request.user:
			return JsonResponse({
				'success': True,
				'p1': {'id': p1Id, 'username': p1Username},
				'p2': {'id': p2Id, 'username': p2Username},
				'ai': game.ai,
				'p1score': game.p1Score,
				'p2score': game.p2Score,
				'winScore': game.scoreToWin,
				'ballSpeed': game.ballSpeed,
				'bonuses': game.bonuses,
				'p1Left': game.p1Left,
				'p1Right': game.p1Right,
				'p2Left': game.p2Left,
				'p2Right': game.p2Right,
				'date' : game.date,
				'p2Local': game.p2Local,
				'html': render_to_string('website/gameOverlay.html'),
			});
		else:
			return JsonResponse({
				'success': False,
			})

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

def deleteRequest(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		request = FriendRequest.objects.get(userFrom_id=data['from'], userTo=request.user)
		request.delete()
		return JsonResponse({
			'success': True,
		});

def addFriend(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		user = User.objects.get(id=data['id'])
		friendRequest = FriendRequest(userFrom=request.user, userTo=user, accepted=False)
		friendRequest.save()
		return JsonResponse({
			'success': True,
		});

def gameNew1vs1(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		game = Game(p1=request.user, ai=data['ai'], scoreToWin=data['winScore'], ballSpeed=data['startSpeed'], bonuses=data['bonuses'], p1Left=data['leftKey'], p1Right=data['rightKey'], p2Left=data['leftKey2'], p2Right=data['rightKey2'], p2Local=data['p2Local'], gameType=1)
		game.save()
		return JsonResponse({
			'success': True,
			'id': game.id,
		});

def gameNew1vsAi(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		game = Game(p1=request.user, ai=data['ai'], scoreToWin=data['winScore'], ballSpeed=data['startSpeed'], bonuses=data['bonuses'], p1Left=data['leftKey'], p1Right=data['rightKey'])
		game.save()
		return JsonResponse({
			'success': True,
			'id': game.id,
		});

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

def unblockUser(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		user = User.objects.get(id=data['id'])
		blockedUser = BlockedUser.objects.get(userFrom=request.user, userBlocked=user)
		blockedUser.delete()
		return JsonResponse({
			'success': True,
		});

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

def profilMenu(request):
	if request.method == 'POST':
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/profilMenu.html', {"user": request.user}),
		});

def loginForm(request):
	if request.method == 'POST':
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/login.html', {"user": request.user}),
		});

def registerForm(request):
	if request.method == 'POST':
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/register.html'),
		});



@csrf_exempt
def registerUser(request):
    if request.method == 'POST':
        user_form = CustomUserCreationForm(request.POST, request.FILES)
        if user_form.is_valid():
            try:
                profile_picture = request.FILES.get('profilPicture')
                if profile_picture:
                    if profile_picture.size > 2 * 1024 * 1024:
                        raise ValidationError('File size exceeds 2MB.')

                # Check file type
                    if profile_picture.content_type not in ['image/jpeg', 'image/png', 'image/gif']:
                        raise ValidationError('Unsupported file type. Please upload an image file (JPEG, PNG, GIF).')

                    # Check file readability
                    try:
                        profile_picture.open()
                        profile_picture.read()
                    except Exception as e:
                        raise ValidationError(f'Error reading file: {str(e)}')
                user = user_form.save()
                user = authenticate(username=request.POST["username"], password=request.POST["password1"])
                if user is not None:
                    # login(request, user) # Uncomment this line if you want to login the user immediately after registration
                    return JsonResponse({'success': True})
                else:
                    return JsonResponse({'success': False, 'message': 'Authentication failed'})
            except ValidationError as e:
                return JsonResponse({'success': False, 'message': str(e)})

        errors = user_form.errors.get_json_data()
        error_messages = []
        for field, field_errors in errors.items():
            for error in field_errors:
                error_messages.append(error['message'])
        return JsonResponse({'success': False, 'message': ' '.join(error_messages)})

    return JsonResponse({'success': False, 'message': 'Invalid request method'})

def homeView(request):
	if request.method == 'POST':
		if request.user.is_authenticated:
			friendRequest = FriendRequest.objects.filter(userTo=request.user).exclude(accepted=True)
			unfinishedGames = Game.objects.filter(Q(p1=request.user) | Q(p2=request.user)).exclude(scoreToWin__lte=F('p1Score')).exclude(scoreToWin__lte=F('p2Score')).exclude(forfeit__isnull=False)
		else:
			friendRequest = []
			unfinishedGames = []
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/home.html', {"user": request.user, "friendRequest": friendRequest, "unfinishedGames": unfinishedGames}),
		});

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

def chatMenu(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		user = User.objects.get(id=data['id']);
		isFriend = request.user.friends.filter(id=data['id']).exists()
		isBlocked = BlockedUser.objects.filter(userFrom=request.user, userBlocked__id=data['id']).exists()
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/chatMenu.html', {"user": request.user, "isFriend": isFriend, "isBlocked": isBlocked, "for": user}),
		})

def localAiConfig(request):
	if request.method == 'POST':
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/localAiConfig.html'),
		})

def localConfig(request):
	if request.method == 'POST':
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/localConfig.html'),
		})

def createGame(request):
	if request.method == 'POST':
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/createGame.html'),
		})

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

def chatMessageView(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		friend = User.objects.get(id=data['user']['id'])
		blocked = BlockedUser.objects.filter(userFrom=request.user, userBlocked__id=data['user']['id']).exists();
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/chatMessageView.html', {"data": data, "user": request.user, "friend": friend, "blocked": blocked}),
		});

def friendRequestView(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		friend = User.objects.get(id=data['from'])
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/friendRequestView.html', {"friend": friend, "user": request.user}),
		});

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
