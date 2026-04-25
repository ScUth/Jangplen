from django.conf import settings
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from api.serializer import RegisterSerializer, LoginSerializer, UserSerializer
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework.exceptions import AuthenticationFailed
from api.models import User

class RegisterAPI(generics.GenericAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": token.key
        })

class LoginAPI(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": token.key
        })

class UserAPI(generics.RetrieveAPIView):
    permission_classes = [
        permissions.IsAuthenticated,
    ]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class GoogleLoginAPI(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request, *args, **kwargs):
        token = request.data.get('token')
        if not token:
            raise AuthenticationFailed("No token provided.")
        try:
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                settings.GOOGLE_CLIENT_ID
            )
            email = idinfo['email']
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            display_name = f"{first_name} {last_name}".strip()
            # Check if user exists, if not, create them
            user = User.objects.filter(email=email).first()
            if not user:
                user = User.objects.create_user(
                    email=email,
                    username=email.split('@')[0], # Basic username fallback
                    display_name=display_name
                )
                # We do not set a password, leaving it unusable for standard login
                
            # Generate or retrieve the DRF Token
            auth_token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                "user": UserSerializer(user, context=self.get_serializer_context()).data,
                "token": auth_token.key
            })
        except ValueError:
            raise AuthenticationFailed("Invalid Google token.")