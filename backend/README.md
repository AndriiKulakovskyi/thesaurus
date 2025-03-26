# Thesaurus API

## Installation

After you cloned the repository to your local machine, open a terminal at the root of the downloaded directory.

1. From the project's root path, navigate to `/backend` directory
```bash
$ cd backend
```
2. Create a virtual environnement
```bash
$ python -m venv .venv
```
3. Activate the newly created virtual environnement
```bash
# On Windows
$ . .venv/Scripts/activate
# On MaxOS / Linux systems
$ source .venv/Scripts/activate
```
4. Upgrade `pip`, then install the dependencies
```bash
$ python -m pip install --upgrade pip
$ python -m pip install -r requirements.txt
```
5. Set you environnement variables in the `/backend/.env` file
```bash
SUPABASE_URL=SUPABASE_URL_HERE
SUPABASE_KEY=SUPABASE_KEY_HERE
SUPABASE_APP_USER_EMAIL=SUPABASE_APP_USER_EMAIL_HERE
SUPABASE_APP_USER_PASSWORD=SUPABASE_APP_USER_PASSWORD_HERE
ADMIN_API_KEY=ADMIN_API_KEY_HERE # Optional, if you need administration functions, such as migrating the json files data to the Supabase PostgreSQL database
```
For security purposes, the `ADMIN_API_KEY` should be a randomly generated string of at least 16 characters. You can generate by a opening any Python terminal, and using the Python built-in `secrets` module.
```python
>>> import secrets
>>> secrets.token_hex(16) # A 16 hexadecimal characters long string will be printed in your terminal
```
6. In the terminal, make sure you're still in the `/backend` directory, then **start the application**
```bash
$ fastapi run main.py
```
