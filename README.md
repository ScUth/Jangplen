# Jangplen Music Library API -- Django Only

This is a Django-based application managing a music library. It provides full CRUD operations (Create, Read, Update, Delete) for both **Libraries** and **Songs**, with an intuitive user interface and fully working backend logic.

## Local Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### Installation Steps

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd jangplen
   ```

2. **Navigate to the Django project**:
   ```bash
   cd django
   ```

3. **Create a virtual environment**:
   ```bash
   python -m venv .venv
   ```

4. **Activate the virtual environment**:
   - On Linux/Mac:
     ```bash
     source .venv/bin/activate
     ```
   - On Windows:
     ```bash
     .venv\Scripts\activate
     ```

5. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

6. **Run database migrations**:
   ```bash
   python manage.py migrate
   ```

7. **Start the development server**:
   ```bash
   python manage.py runserver
   ```

8. **Access the application**:
   Open your browser and go to `http://localhost:8000/libraries/` to see the application in action.

### Additional Notes
- The project uses SQLite as the default database, so no additional database setup is required.
- Media files (uploaded songs) are stored in the `media/songs/` directory.
- For production deployment, make sure to configure proper settings in `core/settings.py`.

## Next.js Frontend Setup (Optional)

If you also want to run the Next.js frontend:

1. **Navigate to the Next.js project**:
   ```bash
   cd ../nextjs
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Access the frontend**:
   Open your browser and go to `http://localhost:3000`.

## Features & CRUD Evidence

Here is the breakdown of the CRUD operations available in this project:

### 1. Libraries (Collections of Songs)

1. **Create (C)**
   - **Endpoint/Action:** `/libraries/create/`
   - **Description:** Users can create a new music library by providing a name, a description, and assigning it an owner.

2. **Read (R)**
   - **Endpoint/Action:** `/libraries/` (List all Libraries) and `/libraries/<id>/` (View Library details and its songs).
   - **Description:** Users can view a list of all libraries available, and click on any library to view its stored songs. 

3. **Update (U)**
   - **Endpoint/Action:** `/libraries/<id>/update/`
   - **Description:** Allows modifying the name, description, and owner of a specific library.

4. **Delete (D)**
   - **Endpoint/Action:** `/libraries/<id>/delete/`
   - **Description:** Provides an action to delete an entire library.

### 2. Songs

1. **Create (C)**
   - **Endpoint/Action:** `/song-form/`
   - **Description:** Users can upload a new music file and populate its metadata (Title, Lyrics, Genre, Mood, Details, Base Singer). They can assign it to a specific library explicitly via a dropdown, or pre-select the library if uploading directly from a library's view page.

2. **Read (R)**
   - **Endpoint/Action:** `/songs/<id>/`
   - **Description:** Users can view the comprehensive details of a specific song, including the file properties, lyrics, its assessment status, and its associated library. The library detail page (`/libraries/<id>/`) also lists robust representations of all the associated songs and includes an embedded audio player.

3. **Update (U)**
   - **Endpoint/Action:** `/songs/<id>/update/`
   - **Description:** Gives users the ability to modify the song properties, like changing the genre, updating lyrics, re-assigning it to a different library, or replacing the song file entirely.

4. **Delete (D)**
   - **Endpoint/Action:** `/songs/<id>/delete/`
   - **Description:** Removes a song from the database. When deleting a song from within a library page, it will redirect back to the library seamlessly after deletion.

## Running the Project

To start the server, make sure your virtual environment is active (if you have one), install the necessary requirements, then run:

```bash
python manage.py runserver
```

You can then visit `http://localhost:8000/libraries/` to see the application in action.
