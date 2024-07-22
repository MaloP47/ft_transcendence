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
from website.models import Game, BlockedUser, User, Message, Room, FriendRequest, Tournament
import json
from datetime import datetime, timedelta
from web3 import Web3
from django.conf import settings
#userCreationForm
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model
from website.forms import CustomUserCreationForm
from .forms import editProfileForm
from django.core.exceptions import ValidationError

def index(request):
	return render(request, "website/index.html");

def indexId(request, id):
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
		# For testing only, put back request.user check later
		#return JsonResponse({
		#	'success': True,
		#	'p1': {'id': p1Id, 'username': p1Username},
		#	'p2': {'id': p2Id, 'username': p2Username},
		#	'ai': game.ai,
		#	'p1score': game.p1Score,
		#	'p2score': game.p2Score,
		#	'winScore': game.scoreToWin,
		#	'ballSpeed': game.ballSpeed,
		#	'bonuses': game.bonuses,
		#	'p1Left': game.p1Left,
		#	'p1Right': game.p1Right,
		#	'p2Left': game.p2Left,
		#	'p2Right': game.p2Right,
		#	'date' : game.date,
		#	'p2Local': game.p2Local,
		#	'html': render_to_string('website/gameOverlay.html'),
		#	'gameType': game.gameType,
		#});
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
				 'gameType': game.gameType,
			});
		else:
			return JsonResponse({
				'success': False,
			})

def searchPlayer(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		users = User.objects.filter(username__icontains=data['search']).annotate(
			block=Subquery(Exists(BlockedUser.objects.filter(userFrom=request.user, userBlocked__id=OuterRef("id"))))
		)[:8]
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/searchPlayer.html', {"user": request.user, "users": users}),
		});

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
def gameNewMulti(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		config = data['config']
		p2 = User.objects.get(id=data['p2']['id'])
		if request.user == p2:
			return JsonResponse({
				'success': False,
			});
		game = Game(p1=request.user, p2=p2, ai=config['ai'], scoreToWin=config['winScore'], ballSpeed=config['startSpeed'], bonuses=config['bonuses'], p1Left=config['leftKey'], p1Right=config['rightKey'], p2Left=config['leftKey2'], p2Right=config['rightKey2'], p2Local=config['p2Local'], gameType=2)
		#game = Game(p1=request.user, ai=data['ai'], scoreToWin=data['winScore'], ballSpeed=data['startSpeed'], bonuses=data['bonuses'], p1Left=data['leftKey'], p1Right=data['rightKey'], p2Left=data['leftKey2'], p2Right=data['rightKey2'], p2Local=data['p2Local'], gameType=2)
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

def registerUser(request):
	if request.method == 'POST':
		user_form = CustomUserCreationForm(request.POST, request.FILES)
		if user_form.is_valid():
			try:
				profile_picture = request.FILES.get('profilPicture')
				if profile_picture:
					if profile_picture.size > 1 * 1024 * 1024:
						raise ValidationError('File size exceeds 1MB.')

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
				if not profile_picture:
					user.profilPicture = 'profilPicture/default.jpg'
					user.save()
				user = authenticate(username=request.POST["username"], password=request.POST["password1"])
				if user is not None:
					login(request, user)
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

def createTournamentConfig(request):
	if request.method == 'POST':
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/tournamentConfig.html'),
		})

def createTournamentGame(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		tour = Tournament()
		tour.save()
		players = data['players']
		for p in players:
			user = User.objects.get(id=p['id'])
			tour.users.add(user)
		config = data['config']
		tour.scoreToWin = config['winScore']
		tour.ballSpeed = config['startSpeed']
		tour.bonuses = config['bonuses']
		tour.save()
		p1 =  User.objects.get(id=players[0]['id'])
		p2 =  User.objects.get(id=players[1]['id'])
		p3 =  User.objects.get(id=players[2]['id'])
		p4 =  User.objects.get(id=players[3]['id'])
		game1 = Game(p1=p1,p2=p2, scoreToWin=tour.scoreToWin, ballSpeed=tour.ballSpeed, bonuses=tour.bonuses, gameType=2, tournamentGame=True)
		game1.save()
		game2 = Game(p1=p3,p2=p4, scoreToWin=tour.scoreToWin, ballSpeed=tour.ballSpeed, bonuses=tour.bonuses, gameType=2, tournamentGame=True)
		game2.save()
		return JsonResponse({
			'success': True,
			'g1': game1.id,
			'p1': p1.id,
			'p2': p2.id,
			'g2': game2.id,
			'p3': p3.id,
			'p4': p4.id,
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
def multiConfig(request):
	if request.method == 'POST':
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/multiConfig.html', {'user': request.user}),
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
		})

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
		})

def chatMessageView(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		friend = User.objects.get(id=data['user']['id'])
		blocked = BlockedUser.objects.filter(userFrom=request.user, userBlocked__id=data['user']['id']).exists();
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/chatMessageView.html', {"data": data, "user": request.user, "friend": friend, "blocked": blocked}),
		})

def gameRequestView(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		game = Game.objects.get(id=data['id'])
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/unfinishedGameView.html', {"g": game, "user": request.user}),
		})

def friendRequestView(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"]);
		friend = User.objects.get(id=data['from'])
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/friendRequestView.html', {"friend": friend, "user": request.user}),
		})

def messageSetRead(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"])
		room = data['room']
		user = data['user']
		if (room != "Public"):
			Message.objects.filter(room_id=room).filter(user_id=user).exclude(read=True).update(read=True)
		return JsonResponse({
			'success': True,
		})

def listTournaments(request):
	if request.method == 'POST':
		tour = Tournament.objects.all()
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/listTournaments.html', {"tournaments": tour}),
		})

	##----------------------------------------------------------//
	##						BLOCKCHAIN							//
	##----------------------------------------------------------//

web3 = Web3(Web3.HTTPProvider(settings.API_URL))

try:
	contract = web3.eth.contract(address=settings.CONTRACT_ADDRESS, abi=settings.CONTRACT_ABI)
except Exception as e:
	contract = None

def createTournament(request):
	if contract is None:
		return JsonResponse({'success': False, 'status': 'error', 'message': 'Contract initialization failed'})

	if request.method == 'POST':
		try:
			data = json.loads(request.POST["data"])
			tournament_id = data.get('tournament_id')
			winner_id = data.get('winner_id')
			wins = data.get('wins')
			losses = data.get('losses')

			if None in [tournament_id, winner_id, wins, losses]:
				return JsonResponse({'success': False, 'status': 'error', 'message': 'Missing parameters'})

			account = web3.eth.account.from_key(settings.PRIVATE_KEY)
			recommended_gas_price = web3.eth.gas_price
			increased_gas_price = web3.to_wei(int(recommended_gas_price * 1.1), 'wei')

			transaction = contract.functions.createTournament(winner_id, wins, losses).build_transaction({
				'chainId': 11155111,
				'gas': 2000000,
				'gasPrice': increased_gas_price,
				'nonce': web3.eth.get_transaction_count(account.address),
			})
			signed_txn = web3.eth.account.sign_transaction(transaction, private_key=settings.PRIVATE_KEY)
			tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
			return JsonResponse({'success': True, 'status': 'success', 'message': 'Transaction successful'})
		except Exception as e:
			return JsonResponse({'success': False, 'status': 'error', 'message': str(e)})

	return JsonResponse({'success': False, 'status': 'error', 'message': 'Invalid request method'})

def viewTournament(request, tournament_id):
	if contract is None:
		return JsonResponse({'success': False, 'status': 'error', 'message': 'Contract initialization failed'})
	if request.method == 'POST':
		try:
			#data = json.loads(request.POST["data"])
			#tournament_id = data.get('tournament_id')

			if tournament_id is None:
				return JsonResponse({'success': False, 'status': 'error', 'message': 'Missing tournament ID'})

			if not isinstance(tournament_id, int) or tournament_id < 0:
				return JsonResponse({'success': False, 'status': 'error', 'message': 'Invalid (negative) tournament ID'})

			tournament_length = contract.functions.getTournamentLength().call()

			if tournament_id > tournament_length - 1:
				return JsonResponse({'success': False, 'status': 'error', 'message': "Tournament ID doesn't exist"})

			tournament = contract.functions.getTournament(tournament_id).call()
			winner_id, winner_wins, winner_losses = tournament

			return JsonResponse({
				'success': True,
				'status': 'success',
				'tournament_id': tournament_id,
				'winner_id': winner_id,
				'winner_wins': winner_wins,
				'winner_losses': winner_losses
			})
		except Exception as e:
			return JsonResponse({'success': False, 'status': 'error', 'message': str(e)})

	return JsonResponse({'success': False, 'status': 'error', 'message': 'Invalid request method'})

def getTournamentWinner(request):
	if request.method == 'POST':
		data = json.loads(request.POST["data"])
		winner_id = data['winner_id']
		winner_wins = data['winner_wins']
		winner_losses = data['winner_losses']
		try:
			winner = User.objects.get(id=winner_id)
			return JsonResponse({
				'success': True,
				'html': render_to_string('website/tournamentWinner.html', {'winner': winner, 'winner_wins': winner_wins, 'winner_losses': winner_losses})
			})
		except User.DoesNotExist:
			winner = User(username="Unknown User")
			return JsonResponse({
				'success': False,
				'html': render_to_string('website/tournamentWinner.html', {'winner': winner, 'winner_wins': winner_wins, 'winner_losses': winner_losses})
			})


	##----------------------------------------------------------//
	##						TOURNAMENT							//
	##----------------------------------------------------------//

# Once tournament is over createTournament output along with Tournament pk id is passed to this fn
def	setIdBc(request, tournament_id):
	if request.method == 'POST':
		data = json.loads(request.POST["data"])
		success = data['success']
		if success == True:
			tournament = Tournament.objects.get(id=tournament_id)
			len = contract.functions.getTournamentLength().call()
			tournament.idBC = len - 1
			tournament.save()


def profile(request, user_id):
	if request.method == 'POST':
		perso = True
		if user_id != request.user.id:
			perso = False
			user = User.objects.get(id=user_id)
		else:
			user = request.user
		singleGames = Game.objects.filter(Q(p1=user) | Q(p2=user)).order_by('-date')
		p1vsAiWinCount = Game.objects.filter(p1=user, p2=None, p2Local='').filter(p1Score__gte=F('scoreToWin')).count()
		p1vsAiLossCount = Game.objects.filter(p1=user, p2=None, p2Local='').filter(p2Score__gte=F('scoreToWin')).count()
		p1vsAiWinForfeitCount = Game.objects.filter(p1=user, p2=None, p2Local='').filter(~Q(forfeit=user) & ~Q(forfeit=None)).count()
		p1vsAiLossForfeitCount = Game.objects.filter(p1=user, p2=None, p2Local='').filter(forfeit=user).count()

		p1vs1WinCount = Game.objects.filter(p1=user).filter(~Q(p2=None) | ~Q(p2Local='')).filter(p1Score__gte=F('scoreToWin')).count()
		p1vs1LossCount = Game.objects.filter(p1=user).filter(~Q(p2=None) | ~Q(p2Local='')).filter(p2Score__gte=F('scoreToWin')).count()
		p1vs1WinForfeitCount = Game.objects.filter(p1=user).filter(~Q(p2=None) | ~Q(p2Local='')).filter(~Q(forfeit=user) & ~Q(forfeit=None)).count()
		p1vs1LossForfeitCount = Game.objects.filter(p1=user).filter(~Q(p2=None) | ~Q(p2Local='')).filter(forfeit=user).count()

		p2vs1WinCount = Game.objects.filter(p2=user).filter(p2Score__gte=F('scoreToWin')).count()
		p2vs1LossCount = Game.objects.filter(p2=user).filter(p1Score__gte=F('scoreToWin')).count()
		p2vs1WinForfeitCount = Game.objects.filter(p2=user).filter(~Q(forfeit=user) & ~Q(forfeit=None)).count()
		p2vs1LossForfeitCount = Game.objects.filter(p2=user).filter(forfeit=user).count()
		return JsonResponse({
			'success': True,
			'html': render_to_string('website/profile.html', {
				"user": user,
				"perso": perso,
				"singleGames": singleGames,
				"aiWin": p1vsAiWinCount,
				"aiLoss": p1vsAiLossCount,
				"aiTot": p1vsAiWinCount + p1vsAiLossCount,
				"aiWinForfeit": p1vsAiWinForfeitCount,
				"aiLossForfeit": p1vsAiLossForfeitCount,
				"aiForfeitTot": p1vsAiWinForfeitCount + p1vsAiLossForfeitCount,
				"v1Win": p1vs1WinCount + p2vs1WinCount,
				"v1Loss": p1vs1LossCount + p2vs1LossCount,
				"v1Tot": p1vs1WinCount + p2vs1WinCount + p1vs1LossCount + p2vs1LossCount,
				"v1WinForfeit": p1vs1WinForfeitCount + p2vs1WinForfeitCount,
				"v1LossForfeit": p1vs1LossForfeitCount + p2vs1LossForfeitCount,
				"v1ForfeitTot": p1vs1WinForfeitCount + p2vs1WinForfeitCount + p1vs1LossForfeitCount + p2vs1LossForfeitCount,
				"form": editProfileForm({"username": user.username, "email": user.email})
			}),
	})
def profileEdit(request, user_id):
    if request.method == 'POST':
        profile_form = editProfileForm(request.POST, request.FILES, request.user)
        if profile_form.is_valid():
            try:
                profile_picture = request.FILES.get('profilPicture')
                if profile_picture:
                    if profile_picture.size > 1 * 1024 * 1024:
                        raise ValidationError('File size exceeds 1MB.')

                    if profile_picture.content_type not in ['image/jpeg', 'image/png', 'image/gif']:
                        raise ValidationError('Unsupported file type. Please upload an image file (JPEG, PNG, GIF).')

                    try:
                        profile_picture.open()
                        profile_picture.read()
                    except Exception as e:
                        raise ValidationError(f'Error reading file: {str(e)}')

                user = profile_form.save()
                user = authenticate(username=request.POST["username"], password=request.POST["password"])
                if user is not None:
                    return JsonResponse({'success': True})
                else:
                    return JsonResponse({'success': False, 'message': 'Profile change failed'})
            except ValidationError as e:
                return JsonResponse({'success': False, 'message': str(e)})

        errors = profile_form.errors.get_json_data()
        error_messages = []
        for field, field_errors in errors.items():
            for error in field_errors:
                error_messages.append(error['message'])
        return JsonResponse({'success': False, 'message': ' '.join(error_messages)})

    return JsonResponse({'success': False, 'message': 'Invalid request method'})
