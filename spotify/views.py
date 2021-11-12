from django.shortcuts import render, redirect
from music_player.settings import CLIENT_ID, CLIENT_SECRET, REDIRECT_URI
from requests import Request
from requests.api import post
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from spotify.models import Vote

from .util import execute_spotify_api_request, is_spotify_authenticated, update_or_create_user_tokens, pause_song, play_song, skip_song

from api.models import Room

# This endpoint will get the url that frontend user uses to authorize with spotify
class AuthURL(APIView):
    def get(self, request, format=None):
        # scope of actions we request to have authorization from spotify api
        scopes = 'user-read-playback-state user-modify-playback-state user-read-currently-playing'

        # Generate a url to send to spotify api, have the frontend get this and send from there
        url = Request('GET', 'https://accounts.spotify.com/authorize', params={
            'scope': scopes,
            'response_type': 'code',
            'client_id': CLIENT_ID,
            'redirect_uri': REDIRECT_URI,
        }).prepare().url

        return Response({'url': url}, status=status.HTTP_200_OK)
    
# This endpoint will handle the redirect endpoint
def spotify_callback(request, format=None):
    code = request.GET.get('code')
    error = request.GET.get('error')

    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id' : CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    refresh_token = response.get('refresh_token')
    expires_in = response.get('expires_in')
    error = response.get('error')

    # Debug check len
    # print('access token len:', len(access_token))
    # print('token type:', token_type)
    # print('refresh token len:', len(refresh_token))
    

    # store the token in the database, associate user session with token
    if not request.session.exists(request.session.session_key):
        request.session.create()
    update_or_create_user_tokens(session_id=request.session.session_key, access_token=access_token, token_type=token_type, refresh_token=refresh_token, expires_in=expires_in)

    # Redirect back to frontend application home page
    # app_name:page_name. e.g frontend:home
    return redirect('frontend:')

class isAuthenticated(APIView):
    def get(self, request, format=None):
        is_authenticated = is_spotify_authenticated(self.request.session.session_key)

        return Response({'status': is_authenticated}, status=status.HTTP_200_OK)

class CurrentSong(APIView):
    def get(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)
        if room.exists():
            room = room[0]
        else:
            return Response({'Error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
        host = room.host
        endpoint = "/player/currently-playing"
        response = execute_spotify_api_request(host, endpoint)
        
        if 'error' in response or 'item' not in response:
            return Response({}, status=status.HTTP_204_NO_CONTENT)
        
        item = response.get('item')
        duration = item.get('duration_ms')
        progress = response.get('progress_ms')
        album_cover = item.get('album').get('images')[0].get('url')
        is_playing = response.get('is_playing')
        song_id = item.get('id')
        artist_string = ""

        for i, artist in enumerate(item.get('artists')):
            if i > 0:
                artist_string += ", "
            artist_string += artist.get('name')

        # Get the current number of votes for the room
        votes = Vote.objects.filter(room=room, song_id=song_id)

        song = {
            'title': item.get('name'),
            'artist': artist_string,
            'duration': duration,
            'time': progress,
            'image_url': album_cover,
            'is_playing': is_playing,
            'votes': len(votes),
            'votes_required': room.votes_to_skip,
            'id': song_id
        } 

        # Check if we have skipped songs, and update the current song of the room
        self.update_room_song(room, song_id)


        return Response(song, status=status.HTTP_200_OK)
    
    def update_room_song(self, room, song_id):
        current_song = room.current_song

        # Check to see if the current song has changed, if yes, we need to reset votes
        if current_song != song_id:
            room.current_song = song_id
            room.save(update_fields=['current_song'])
            # Reset the vote by deleting
            Vote.objects.filter(room = room).delete()
    
class PauseSong(APIView):
    def put(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code = room_code)[0]

        # Only host of the room or room allows guest pause can pause the song
        if self.request.session.session_key == room.host or room.guest_can_pause:
            pause_song(room.host)
            return Response({}, status=status.HTTP_204_NO_CONTENT)

        return Response({}, status=status.HTTP_403_FORBIDDEN)

class PlaySong(APIView):
    def put(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code = room_code)[0]

        # Only host of the room or room allows guest pause can play the song
        if self.request.session.session_key == room.host or room.guest_can_pause:
            play_song(room.host)
            return Response({}, status=status.HTTP_204_NO_CONTENT)

        return Response({}, status=status.HTTP_403_FORBIDDEN)

class SkipSong(APIView):
    def post(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code = room_code)[0]
        votes = Vote.objects.filter(room=room, song_id=room.current_song)
        votes_needed = room.votes_to_skip


        # The room host can skip the song without voting, or the votes and reaches the required votes to skip
        if self.request.session.session_key == room.host or len(votes) + 1 >= votes_needed:
            # Clear the votes we have for the room
            votes.delete()
            skip_song(room.host)
        else:
            # If not host, we will create a new vote
            vote = Vote(user = self.request.session.session_key, room=room, song_id=room.current_song)
            vote.save()


        return Response({}, status=status.HTTP_204_NO_CONTENT)
