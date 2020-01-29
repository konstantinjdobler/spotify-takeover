# Spotify Takeover

## Concept
Participants can takeover the spotify playback of the application account for a set amount of time / songs. Once they are authenticated and have linked their Spotify account, they can start the takeover. After a countdown, all playback they do on their own account will be mirrored on the application account.

## Technical Details
On takeover, poll the participants Spotify account every second for its currently played song and the playback time. Mirror to the application account. In case of playback *time* only act if a certain margin of error is surpassed in order to prevent jumpy playback on the application account.

### Known limitations
The slave device needs to be seen as "active" by Spotify. To do so play at least one song after opening Spotify on the device.

## On Rate Limits
Rate limits polling the `currently-playing` endpoint of the Spotify Web API are a [known problem](https://github.com/spotify/web-api/issues/492). However the users reporting problems operate on a significantly larger scale than the project (> 100k requests / day). 


