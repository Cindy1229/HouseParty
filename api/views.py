from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Room
from .serializers import CreateRoomSerializer, RoomSerializer, UpdateRoomSerializer

# Create your views here.
# a generate view of list api
class RoomView(generics.ListAPIView):
    # what to return
    queryset = Room.objects.all()
    # what format to return, outgoing data
    serializer_class = RoomSerializer


class CreateRoomView(APIView):
    # This is a serializer for incomming request payload
    serializer_class = CreateRoomSerializer
    
    def post(self, request, format=None):
        # The session key will be stored for identifying hosts
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()
        
        # Taking in the request data
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            guest_can_pause = serializer.data.get('guest_can_pause')
            votes_to_skip =  serializer.data.get('votes_to_skip')
            host = self.request.session.session_key

            # Update the room if the user already in a room
            queryset = Room.objects.filter(host=host)
            if queryset.exists():
                room = queryset[0]
                room.guest_can_pause = guest_can_pause
                room.votes_to_skip = votes_to_skip
                room.save(update_fields=['guest_can_pause', 'votes_to_skip'])
                self.request.session['room_code'] = room.code
                return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)
            # Otherwise create a new room
            else:
                room = Room(host=host, guest_can_pause=guest_can_pause, votes_to_skip=votes_to_skip)
                room.save()
                self.request.session['room_code'] = room.code
                # Return Response, use the RoomSerializer for outgoing data
                return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)
        #If request payload is not valid
        return Response({'Bad Request': 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)

class GetRoom(APIView):
    serializer_class = RoomSerializer
    look_up_kwarg = 'code'

    def get(self, request, format=None):
        code =  request.GET.get(self.look_up_kwarg)
        if code != None:
            room = Room.objects.filter(code = code)

            if len(room) > 0:
                data = RoomSerializer(room[0]).data
                # adding an extra field to indicate if the user requesting is the host of the room
                data['is_host'] = self.request.session.session_key == room[0].host
                return Response(data, status=status.HTTP_200_OK)
            return Response({'Room not found': 'Invalid room code'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'Bad Request': 'Code parameter not found in request'}, status=status.HTTP_400_BAD_REQUEST)

class JoinRoom(APIView):
    look_up_kwarg = 'code'
    def post(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()
        
        code = request.data.get(self.look_up_kwarg)
        if code != None:
            room_result = Room.objects.filter(code = code)
            if len(room_result) > 0:
                room = room_result[0]
                # add user to room
                self.request.session['room_code'] = code
                return Response({'message': 'Room joined'}, status=status.HTTP_200_OK)
            return Response({'Bad Request': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({'Bad Request': 'Invalid post data, code not found'}, status=status.HTTP_400_BAD_REQUEST)

class UserInRoom(APIView):
    def get(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        data = {
            'code': self.request.session.get('room_code')
        }

        return Response(data, status=status.HTTP_200_OK)

class LeaveRoom(APIView):
    def post(self, request, format=None):
        if 'room_code' in self.request.session:
            self.request.session.pop('room_code')
            # if user that leaves is the host, delete the room
            host_id = self.request.session.session_key
            room_results = Room.objects.filter(host = host_id)

            if len(room_results) > 0:
                room = room_results[0]
                room.delete()
    
        return Response({'Message': 'Leave room successfully'}, status=status.HTTP_200_OK)

class UpdateRoom(APIView):

    Serializer_class =UpdateRoomSerializer


    def patch(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        serializer = self.Serializer_class(data=request.data)

        if serializer.is_valid():
            guest_can_pause = serializer.data.get('guest_can_pause')
            votes_to_skip = serializer.data.get('votes_to_skip')
            code = serializer.data.get('code')

            queryset = Room.objects.filter(code = code)
            if not queryset.exists():
                return Response({'Message': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
            
            room = queryset[0]
            # Only host can update the room
            user_id = self.request.session.session_key
            if room.host != user_id:
                return Response({'Message': 'Only host can update this room'}, status=status.HTTP_403_FORBIDDEN)
            
            room.guest_can_pause = guest_can_pause
            room.votes_to_skip = votes_to_skip
            room.save(update_fields = ['guest_can_pause', 'votes_to_skip'])
            return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)

        return Response({'Bad Request' : 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)