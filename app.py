from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from whatsapp_bot import WhatsAppBot
import os
import threading
import time

app = Flask(__name__, static_folder='static')
CORS(app)

# Global bot instance
bot = None
status = {"running": False, "session_active": False, "message": ""}

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "session": status})

@app.route('/api/login', methods=['POST'])
def login():
    global bot, status
    try:
        data = request.json
        headless = data.get('headless', True)
        
        if not bot:
            bot = WhatsAppBot(headless=headless)
        
        if bot.login():
            status["session_active"] = True
            status["running"] = True
            status["message"] = "✅ Logged in! Ready to create groups."
            return jsonify({"success": True, "message": "Login successful"})
        return jsonify({"success": False, "message": "Login failed"}), 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/create-group', methods=['POST'])
def create_group():
    global status
    if not status["session_active"]:
        return jsonify({"success": False, "message": "❌ Not logged in. POST /api/login first"}), 401
    
    data = request.json
    group_name = data.get('group_name')
    participants = data.get('participants', [])
    
    if not group_name or len(participants) < 1:
        return jsonify({"success": False, "message": "Group name and at least 1 participant required"}), 400
    
    success = bot.create_group(group_name, participants)
    if success:
        status["message"] = f"✅ Created group: {group_name}"
        return jsonify({"success": True, "group": group_name, "members": len(participants)})
    return jsonify({"success": False, "message": "Failed to create group"}), 400

@app.route('/api/add-members', methods=['POST'])
def add_members():
    global status
    if not status["session_active"]:
        return jsonify({"success": False, "message": "❌ Not logged in"}), 401
    
    data = request.json
    group_name = data.get('group_name')
    members = data.get('members', [])
    
    if not group_name or not members:
        return jsonify({"success": False, "message": "Group name and members required"}), 400
    
    success = bot.add_members_to_group(group_name, members)
    if success:
        status["message"] = f"✅ Added {len(members)} members to {group_name}"
        return jsonify({"success": True, "added": len(members)})
    return jsonify({"success": False, "message": "Failed to add members"}), 400

@app.route('/api/status', methods=['GET'])
def status_check():
    return jsonify(status)

@app.route('/api/logout', methods=['POST'])
def logout():
    global bot, status
    try:
        if bot:
            bot.close()
        bot = None
        status = {"running": False, "session_active": False, "message": "Logged out"}
        return jsonify({"success": True})
    except:
        return jsonify({"success": True})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
