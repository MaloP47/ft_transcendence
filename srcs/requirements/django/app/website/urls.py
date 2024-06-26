from django.urls import path, re_path

from . import views

urlpatterns = [
	path('api/user/logout/', views.logoutUser, name="logout"),
	path('api/user/signin/', views.signinUser, name="signin"),
	path('api/user/search/', views.searchUser, name="searchUser"),
	path('api/user/addfriend/', views.addFriend, name="addFriend"),
	path('api/user/block/', views.blockUser, name="blockUser"),
	path('api/user/unblock/', views.unblockUser, name="unblockUser"),
	path('api/user/deletefriend/', views.deleteFriend, name="deleteFriend"),
	path('api/user/acceptfriend/', views.acceptFriend, name="acceptFriend"),
	path('api/user/deleterequest/', views.deleteRequest, name="deleteRequest"),
	path('api/user/', views.getUser, name="getUser"),

	path('api/game/get/', views.getGame, name="getGame"),
	path('api/game/save/', views.saveGame, name="saveGame"),
	path('api/game/new/1vsAI/', views.gameNew1vsAi, name="gameNew1vsAi"),
	path('api/game/new/1vs1/', views.gameNew1vs1, name="gameNew1vs1"),
	path('api/game/forfeit/', views.gameForfeit, name="gameForfeit"),

	path('api/messages/setRead/', views.messageSetRead, name="messageSetRead"),
	path('api/view/chatMenu/', views.chatMenu, name="chatMenu"),
	path('api/view/createGame/', views.createGame, name="createGame"),
	path('api/view/localAiConfig/', views.localAiConfig, name="localAiConfig"),
	path('api/view/localConfig/', views.localConfig, name="localConfig"),
	path('api/view/profilMenu/', views.profilMenu, name="profilMenu"),
	path('api/view/login/', views.loginForm, name="loginForm"),
	path('api/view/register/', views.registerForm, name="registerForm"),
	path('api/view/home/', views.homeView, name="homeView"),
	path('api/view/chatView/', views.chatView, name="chatView"),
	path('api/view/chatUserView/', views.chatUserView, name="chatUserView"),
	path('api/view/chatRoomsView/', views.chatRoomsView, name="chatRoomsView"),
	path('api/view/chatMessageView/', views.chatMessageView, name="chatMessageView"),
	path('api/view/friendRequestView/', views.friendRequestView, name="friendRequestView"),



	path('', views.index, name="index"),
	path('login', views.index, name="index"),
	path('register', views.index, name="index"),
	path('play1vsAI', views.index, name="index"),
    path('play1vsAI/<int:game_id>', views.indexGame, name="indexGame"),
	path('play1vs1', views.index, name="index"),
    path('play1vs1/<int:game_id>', views.indexGame, name="indexGame"),
]
