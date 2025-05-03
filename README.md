# URL Shortener API with Analytics

This is a simple URL shortener API with analytics and custom URL support. It provides endpoints to create short URLs, track usage, and retrieve analytics data.

## Setup & Configuration

### Prerequisites

- [Cloudflare Workers](https://workers.cloudflare.com/) account
- [D1 Database](https://developers.cloudflare.com/d1) for data storage
- Node.js 20+ installed

### 1. Clone the repository

```bash
git clone https://github.com/belphegor-s/url-shortner
cd url-shortner
```

### 2. Install Dependencies

Install required dependencies using `npm`:

```bash
npm install
```

### 3. Configure Environment Variables

Replace D1 SQL `database_id` in `./wrangler.jsonc`:

```json
"d1_databases": [
    {
        "binding": "DB",
        "database_name": "url_shortener_db",
        "database_id": "<your_d1_database_id>"
    }
]
```

### 4. Deploy to Cloudflare Workers

Use the `wrangler` CLI to deploy the application to Cloudflare Workers:

1. Install Wrangler if you haven't already:

```bash
npm install -g wrangler
```

2. Authenticate with Cloudflare:

```bash
wrangler login
```

3. Deploy the worker:

```bash
wrangler deploy
```

This will deploy the application to Cloudflare Workers, and your API will be accessible at the provided URL.

### 5. API Endpoints

- **GET `/create`**: Create a short URL from an original URL using query parameters.

  **Query Parameters**:

  ```bash
  ?url=https://example.com&custom_id=mycustomid # `custom_id` is optional
  ```

  **Response**:

  ```json
  {
  	"short_url": "https://<your-worker-url>/<short_id>",
  	"existing": true // Indicates if the URL already existed in the database
  }
  ```

- **GET `/analytics`**: Fetch analytics for all short URLs.

  **Query Parameters**:

  - `page` (optional): The page number for pagination.
  - `limit` (optional): The number of results per page (default: 50, max: 500).
  - `sort` (optional): Sort order (`asc` or `desc`, default: `desc`).

- **DELETE `/analytics`**: Delete analytics and short URLs for the provided `ids` (`short_id[]`).

  **JSON Body**:

  ```json
  {
  	"ids": ["abc123", "xyz456"]
  }
  ```

- **GET `/analytics/:id`**: Fetch analytics for a specific short URL ID.

- **GET `/:id`**: Redirect to the original URL for a given short URL ID. This also logs analytics such as IP address, user-agent, country code, and referrer.

### 6. Swagger UI Documentation

Access the API documentation [Here](https://pixly.sh) or locally at:

```bash
/  # root route
```

This will provide an interactive UI to explore and test the API endpoints.

### 7. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
