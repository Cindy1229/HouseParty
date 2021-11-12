from requests.api import post, get, put
from music_player.settings import CLIENT_ID, CLIENT_SECRET
from .models import SpotifyToken
from django.utils import timezone
from datetime import timedelta

BASE_URL = 'https://api.spotify.com/v1/me'

# Return the user with the session id, return none if user doesn't have a token
def get_user_tokens(session_id):
    user_tokens = SpotifyToken.objects.filter(user = session_id)
    if user_tokens.exists():
        return user_tokens[0]
    else:
        return None

def update_or_create_user_tokens(session_id, access_token, token_type, expires_in, refresh_token):
    tokens = get_user_tokens(session_id)
    
    # Update the expire time to be 1 hour (3600 mx) after current time
    expires_in = timezone.now() + timedelta(seconds=expires_in)

    if tokens:
        # if tokens user exists, update
        tokens.access_token = access_token
        tokens.refresh_token = refresh_token
        tokens.expires_in = expires_in
        tokens.token_type = token_type
        tokens.save(update_fields=['access_token', 'token_type', 'expires_in', 'refresh_token'])
    else:
        # create a new token user
        tokens = SpotifyToken(user=session_id, access_token=access_token, token_type=token_type, expires_in=expires_in, refresh_token=refresh_token)
        tokens.save()

# Check if the user has authenticated with spotify, if yes, don't authenticate again
def is_spotify_authenticated(session_id):
    tokens = get_user_tokens(session_id)

    if tokens:
        # If the user's expiry has passed, need to update it
        expiry = tokens.expires_in
        if expiry <= timezone.now():
            # Need to refresh the token
            refresh_spotify_token(session_id)
            
        return True
    
    return False

# Refresh the user's access token
def refresh_spotify_token(session_id):
    refresh_token = get_user_tokens(session_id).refresh_token

    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    expires_in = response.get('expires_in')

    update_or_create_user_tokens(session_id, access_token, token_type, expires_in, refresh_token)

# Execute a request to web api, using user's access token
def execute_spotify_api_request(session_id, endpoint, post_=False, put_=False):
    tokens = get_user_tokens(session_id)
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+ tokens.access_token,
    }

    if post_:
        post(BASE_URL + endpoint, headers=headers)
    if put_:
        put(BASE_URL+endpoint, headers=headers)
    
    response = get(BASE_URL+endpoint, {}, headers=headers)
    try:
       return response.json()
    except:
        return {'Error': 'Could not send request'}

def pause_song(session_id):
    return execute_spotify_api_request(session_id, '/player/pause', put_=True)


def play_song(session_id):
    return execute_spotify_api_request(session_id, '/player/play', put_=True)

def skip_song(session_id):
    return execute_spotify_api_request(session_id, '/player/next', post_=True)