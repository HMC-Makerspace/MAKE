use crate::*;

pub async fn update_spotify() {
    // Get currently playing music from spotify
    // GET request to https://api.spotify.com/v1/me/player/currently-playing
    let (id, secret, token) = API_KEYS.lock().await.get_spotify_tuple();

    // First, refresh token
    // JS:
    let client = Client::new();

    let base64 = &BASE64_STANDARD_NO_PAD.encode(&format!("{}:{}", id, secret));

    let mut headers = HeaderMap::new();

    // Add bearer auth authorization header
    headers.insert(
        "Authorization",
        HeaderValue::from_str(&format!("Basic {}", base64)).unwrap(),
    );

    headers.insert(
        "Content-Type",
        HeaderValue::from_str("application/x-www-form-urlencoded").unwrap(),
    );

    let response = client
        .post("https://accounts.spotify.com/api/token")
        .headers(headers)
        .body(format!("grant_type=refresh_token&refresh_token={}", token))
        .send()
        .await;

    if response.is_err() {
        error!(
            "Failed to refresh spotify token: {}",
            response.err().unwrap()
        );
    } else {
        // Get json "access_token"
        let access_token = response.unwrap().text().await;

        if access_token.is_err() {
            error!(
                "Failed to get access token from spotify: {}",
                access_token.err().unwrap()
            );
        } else {
            let access_token = access_token.unwrap();

            if access_token.contains("error") {
                error!("Failed to refresh spotify token: {}", access_token);
            } else {
                let access_token = between(&access_token, "access_token\":\"", "\"");

                info!("Refreshed spotify token!");

                let mut headers = HeaderMap::new();

                headers.insert(
                    "Authorization",
                    HeaderValue::from_str(&format!("Bearer {}", access_token)).unwrap(),
                );

                let response = client
                    .get("https://api.spotify.com/v1/me/player/currently-playing")
                    .headers(headers)
                    .send()
                    .await;

                if response.is_err() {
                    error!(
                        "Failed to get currently playing song from spotify: {}",
                        response.err().unwrap()
                    );
                } else {
                    let response = response.unwrap();

                    if response.status() == 200 {
                        let body = response.text().await;

                        if body.is_err() {
                            error!(
                                "Failed to get body of spotify response: {}",
                                body.err().unwrap()
                            );
                        } else {
                            let body = body.unwrap();

                            let json: Value = serde_json::from_str(&body).unwrap();

                            let item = json.get("item").cloned();

                            info!("Got currently playing song from spotify");

                            MEMORY_DATABASE.lock().await.spotify = item.clone();
                        }
                    } else if response.status() == 204 {
                        info!("No song is currently playing on spotify");
                        MEMORY_DATABASE.lock().await.spotify = None;
                    } else {
                        error!(
                            "Failed to get currently playing song from spotify: {}",
                            response.status()
                        );
                    }
                }
            }
        }
    }
}
