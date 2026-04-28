# insighta CLI

A globally installable terminal tool for querying Insighta Labs+ demographic profiles.

## Installation

```bash
npm install -g .
```

Or link locally for development:
```bash
npm run build
npm link
```

## Setup

```bash
cp .env.example .env
# Set INSIGHTA_API_URL to your backend URL
```

## Usage

### Authentication
```bash
insighta login        # Opens GitHub OAuth in your browser
insighta logout       # Clears saved credentials
insighta whoami       # Show current user + role
```

### Profiles
```bash
# List all profiles (paginated)
insighta profiles list

# Filter profiles
insighta profiles list --gender male --country NG
insighta profiles list --age-group adult --min-age 25 --max-age 40
insighta profiles list --sort-by age --order desc --limit 20

# Get a single profile
insighta profiles get <id>

# Natural language search
insighta profiles search "young males from nigeria"
insighta profiles search "females above 30 from ghana" --page 2

# Create a profile (admin only)
insighta profiles create --name "John Doe"

# Delete a profile (admin only)
insighta profiles delete <id>

# Export to CSV
insighta profiles export
insighta profiles export --gender female --output female_profiles.csv
```

## How Auth Works

1. `insighta login` generates a PKCE code verifier + challenge
2. Opens your browser to GitHub OAuth via the backend
3. A local server on port 9876 catches the callback
4. The backend verifies PKCE and returns tokens as JSON
5. Tokens are saved to `~/.insighta/credentials.json`
6. All subsequent requests use the access token automatically
7. When the access token expires (3 min), the CLI silently refreshes it using the refresh token
8. `insighta logout` deletes the credentials file and invalidates the token on the server

## Token Storage

Credentials are stored at `~/.insighta/credentials.json`:
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "user": {
    "id": "...",
    "username": "...",
    "role": "analyst"
  }
}
```