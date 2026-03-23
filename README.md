# Jangplen Music Library API -- Django Only

This is a Django-based application managing a music library. It provides full CRUD operations (Create, Read, Update, Delete) for both **Libraries** and **Songs**, with an intuitive user interface and fully working backend logic.

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
