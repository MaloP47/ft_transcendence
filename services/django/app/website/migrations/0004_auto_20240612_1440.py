from django.db import migrations

def create_public_room(apps, schema_editor):
	Room = apps.get_model("website", "Room")
	publicRoom = Room(publicRoom=True)
	publicRoom.save()

class Migration(migrations.Migration):

	dependencies = [
		('website', '0003_remove_blockeduser_blockeduser_remove_user_blocked_and_more'),
	]

	operations = [
		migrations.RunPython(create_public_room)
	]
