import os
from flask import Flask, request, render_template, jsonify
from werkzeug.utils import secure_filename

# --- Fix for TemplateNotFound Error ---
# We tell Flask that our templates are in the current directory ('.')
# instead of the default 'templates' folder.
app = Flask(__name__, template_folder='.')
# --------------------------------------

# Directory where contestants code will be saved
SUBMISSIONS_DIR = 'all_submissions_1'
os.makedirs(SUBMISSIONS_DIR, exist_ok=True)

@app.route('/')
def index():
    """Serves the main submission_form.html page."""
    return render_template('submission_form.html')

@app.route('/upload', methods=['POST'])
def upload_cont():
    """Handles the file upload from the form."""
    try:
        # Check if contName or contFile is missing
        if 'contName' not in request.form or 'contFile' not in request.files:
            return jsonify({"success": False, "message": "Missing cont name or file."}), 400
        
        cont_name = request.form['contName']
        cont_file = request.files['contFile']

        if not cont_name:
            return jsonify({"success": False, "message": "Contestant's name is empty."}), 400

        if not cont_file or cont_file.filename == '':
            return jsonify({"success": False, "message": "No file selected."}), 400

        # Check for 'Submission.py'
        if cont_file.filename != 'Submission.py':
            return jsonify({"success": False, "message": "File *must* be named 'Submission.py'."}), 400

        # Create a secure cont_name directory (e.g., "My cont" -> "My_cont")
        secure_cont_name = secure_filename(cont_name)
        if not secure_cont_name:
            secure_cont_name = f"cont_{hash(cont_name)}" # Handle weird names

        cont_dir = os.path.join(SUBMISSIONS_DIR, secure_cont_name)
        os.makedirs(cont_dir, exist_ok=True)
        
        # Save the file
        file_path = os.path.join(cont_dir, 'Submission.py')
        cont_file.save(file_path)

        # --- ADD THIS LINE ---
        print(f"File saved! -> {file_path}")
        # ---------------------

        # Send a success message back to the user
        return jsonify({"success": True, "message": f"Successfully submitted '{cont_name}'!"})

    except Exception as e:
        print(f"Error during upload: {e}")
        return jsonify({"success": False, "message": f"An unexpected server error occurred: {e}"}), 500

if __name__ == '__main__':
    print(f"Starting server... Submissions will be saved to '{SUBMISSIONS_DIR}'")
    print("Go to http://127.0.0.1:5000 in your browser.")
    app.run(debug=True, port=5000)