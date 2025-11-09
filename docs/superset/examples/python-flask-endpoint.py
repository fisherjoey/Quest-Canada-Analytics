"""
Quest Canada - Superset Guest Token Endpoint
Python + Flask implementation

This file provides example code for generating Superset guest tokens
from a Python Flask backend with Row-Level Security (RLS) support.

Add this code to your existing server/api/forms_api.py file.
"""

import requests
import os
from flask import request, jsonify
from functools import wraps

# Configuration (use environment variables)
SUPERSET_URL = os.getenv('SUPERSET_URL', 'http://localhost:8088')
SUPERSET_USERNAME = os.getenv('SUPERSET_USERNAME', 'admin')
SUPERSET_PASSWORD = os.getenv('SUPERSET_PASSWORD', 'admin')


def get_superset_access_token():
    """
    Authenticate with Superset and get access token

    Returns:
        str: Access token for Superset API

    Raises:
        Exception: If authentication fails
    """
    try:
        response = requests.post(
            f'{SUPERSET_URL}/api/v1/security/login',
            json={
                'username': SUPERSET_USERNAME,
                'password': SUPERSET_PASSWORD,
                'provider': 'db',
                'refresh': True
            },
            timeout=10
        )

        if response.status_code != 200:
            raise Exception(f'Superset authentication failed: {response.text}')

        return response.json()['access_token']

    except requests.exceptions.RequestException as e:
        raise Exception(f'Failed to connect to Superset: {str(e)}')


def generate_rls_rules(user):
    """
    Generate Row-Level Security rules based on user context

    Args:
        user (dict): User object with properties:
            - role (str): User role ('admin' or 'user')
            - community (str): Community name
            - is_admin (bool): Whether user is admin

    Returns:
        list: List of RLS rule dictionaries
    """
    # Admin users see all data
    if user.get('role') == 'admin' or user.get('is_admin'):
        return []

    # Regular users see only their community's data
    community = user.get('community')
    if community:
        # Escape single quotes to prevent SQL injection
        escaped_community = community.replace("'", "''")

        return [
            {
                # Filter communities table
                'clause': f"communities.name = '{escaped_community}'"
            }
        ]

    # Default: no data access
    return [
        {'clause': '1 = 0'}  # Returns no rows
    ]


def require_auth(f):
    """
    Decorator to require authentication

    In production, replace this with your actual auth logic
    (JWT verification, session checking, etc.)
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Example: Check session or JWT token
        # user = get_current_user_from_session()

        # Mock user for example - REPLACE WITH REAL AUTH
        request.user = {
            'id': 1,
            'email': 'john.doe@calgary.ca',
            'first_name': 'John',
            'last_name': 'Doe',
            'community': 'Calgary',
            'role': 'user'
        }

        if not request.user:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401

        return f(*args, **kwargs)

    return decorated_function


@app.route('/api/superset/guest-token', methods=['POST'])
@require_auth
def get_superset_guest_token():
    """
    Generate Superset guest token for authenticated user

    Request Body:
        {
            "dashboard_id": "abc123-uuid-from-superset"
        }

    Response:
        {
            "success": true,
            "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
            "expires_in": 300
        }

    Error Response:
        {
            "success": false,
            "error": "Error message"
        }
    """
    try:
        # Get user from request (set by auth middleware)
        user = request.user

        # Validate request body
        data = request.json
        dashboard_id = data.get('dashboard_id')

        if not dashboard_id:
            return jsonify({
                'success': False,
                'error': 'dashboard_id is required'
            }), 400

        # 1. Authenticate with Superset
        access_token = get_superset_access_token()

        # 2. Prepare guest token payload
        guest_token_payload = {
            'user': {
                'username': user.get('email', 'guest'),
                'first_name': user.get('first_name', 'User'),
                'last_name': user.get('last_name', '')
            },
            'resources': [
                {
                    'type': 'dashboard',
                    'id': dashboard_id
                }
            ],
            'rls': generate_rls_rules(user)
        }

        # 3. Request guest token from Superset
        response = requests.post(
            f'{SUPERSET_URL}/api/v1/security/guest_token/',
            json=guest_token_payload,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {access_token}'
            },
            timeout=10
        )

        if response.status_code != 200:
            return jsonify({
                'success': False,
                'error': 'Failed to generate guest token',
                'details': response.text
            }), 500

        # 4. Return guest token to client
        guest_token = response.json()['token']

        return jsonify({
            'success': True,
            'token': guest_token,
            'expires_in': 300  # 5 minutes
        }), 200

    except Exception as e:
        print(f'Guest token error: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/superset/dashboards', methods=['GET'])
@require_auth
def get_superset_dashboards():
    """
    Get list of available Superset dashboards

    Response:
        {
            "success": true,
            "dashboards": [
                {
                    "id": 1,
                    "uuid": "abc123-uuid",
                    "title": "Dashboard Name",
                    "url": "/superset/dashboard/1/",
                    "status": "published",
                    "changed_on": "2 days ago"
                }
            ]
        }
    """
    try:
        # Authenticate with Superset
        access_token = get_superset_access_token()

        # Fetch dashboards
        response = requests.get(
            f'{SUPERSET_URL}/api/v1/dashboard/',
            headers={
                'Authorization': f'Bearer {access_token}'
            },
            params={
                'q': '{"page":0,"page_size":100,"order_column":"changed_on_delta_humanized","order_direction":"desc"}'
            },
            timeout=10
        )

        if response.status_code != 200:
            return jsonify({
                'success': False,
                'error': 'Failed to fetch dashboards'
            }), 500

        # Format response
        dashboards_data = response.json()
        dashboards = [
            {
                'id': d['id'],
                'uuid': d['dashboard_uuid'],
                'title': d['dashboard_title'],
                'url': d['url'],
                'status': d.get('status', 'unknown'),
                'changed_on': d.get('changed_on_delta_humanized', '')
            }
            for d in dashboards_data['result']
        ]

        return jsonify({
            'success': True,
            'dashboards': dashboards
        }), 200

    except Exception as e:
        print(f'Dashboards fetch error: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/superset/dashboard/<dashboard_uuid>', methods=['GET'])
@require_auth
def get_superset_dashboard(dashboard_uuid):
    """
    Get specific dashboard details

    Args:
        dashboard_uuid (str): Dashboard UUID

    Response:
        {
            "success": true,
            "dashboard": {
                "id": 1,
                "uuid": "abc123",
                "title": "Dashboard Name",
                "description": "Dashboard description",
                "charts": [...]
            }
        }
    """
    try:
        # Authenticate with Superset
        access_token = get_superset_access_token()

        # Fetch dashboard details
        response = requests.get(
            f'{SUPERSET_URL}/api/v1/dashboard/{dashboard_uuid}',
            headers={
                'Authorization': f'Bearer {access_token}'
            },
            timeout=10
        )

        if response.status_code != 200:
            return jsonify({
                'success': False,
                'error': 'Dashboard not found'
            }), 404

        dashboard_data = response.json()['result']

        return jsonify({
            'success': True,
            'dashboard': {
                'id': dashboard_data['id'],
                'uuid': dashboard_data['uuid'],
                'title': dashboard_data['dashboard_title'],
                'description': dashboard_data.get('description', ''),
                'charts': dashboard_data.get('charts', [])
            }
        }), 200

    except Exception as e:
        print(f'Dashboard fetch error: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# Example: Advanced RLS with multiple tables
def generate_advanced_rls_rules(user):
    """
    Generate comprehensive RLS rules for multiple tables

    This is useful when you have complex data relationships
    and need to filter across multiple tables.
    """
    if user.get('role') == 'admin':
        return []

    community = user.get('community', '').replace("'", "''")

    return [
        # Filter communities table
        {
            'clause': f"communities.name = '{community}'"
        },
        # Filter projects via community_id
        {
            'clause': f"""community_projects.community_id IN (
                SELECT id FROM communities WHERE name = '{community}'
            )"""
        },
        # Filter assessments
        {
            'clause': f"""benchmark_assessments.community_id IN (
                SELECT id FROM communities WHERE name = '{community}'
            )"""
        }
    ]


# Example: Time-based RLS (show only recent data)
def generate_time_based_rls(user, days=90):
    """
    Generate RLS rules that filter by time

    Args:
        user (dict): User object
        days (int): Number of days to look back

    Returns:
        list: RLS rules with time filter
    """
    rules = generate_rls_rules(user)

    # Add time filter
    rules.append({
        'clause': f"created_at >= CURRENT_DATE - INTERVAL '{days} days'"
    })

    return rules


# Example: Conditional RLS based on user attributes
def generate_conditional_rls(user):
    """
    Generate RLS rules based on user attributes

    Different users get different levels of access
    """
    # Admins see everything
    if user.get('role') == 'admin':
        return []

    # Managers see their community
    elif user.get('role') == 'manager':
        community = user.get('community', '').replace("'", "''")
        return [{'clause': f"communities.name = '{community}'"}]

    # Analysts see multiple communities
    elif user.get('role') == 'analyst':
        communities = user.get('communities', [])
        escaped = [c.replace("'", "''") for c in communities]
        community_list = "','".join(escaped)
        return [{'clause': f"communities.name IN ('{community_list}')"}]

    # Default: read-only guest
    else:
        return [{'clause': "status = 'published'"}]
