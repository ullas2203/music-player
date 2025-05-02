from flask import Flask, send_from_directory, jsonify, render_template
import os

app = Flask(__name__)
MUSIC_DIR = os.path.join("static", "audio")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/songs')
def get_songs():
    files = [f for f in os.listdir(MUSIC_DIR) if f.endswith(('.mp3', '.wav'))]
    return jsonify(files)

@app.route('/audio/<filename>')
def serve_song(filename):
    return send_from_directory(MUSIC_DIR, filename)

if __name__ == '__main__':
    app.run(debug=True)
