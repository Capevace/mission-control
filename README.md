<div align="center">
	<a href="https://mateffy.me/mission-control-project">
		<img src="resources/screenshot-2.0.0-rc6.png">
	</a>
	<h1>Mission Control</h1>
	<p>
		Opinionated JavaScript framework for building real-time dashboards
	</p>
	<p>
		<a href="https://mission-control.js.org">Project Homepage</a>
		<span>&nbsp;|&nbsp;</span>
		<a href="https://mission-control.js.org">Docs</a>
	</p>
</div>

<br>

When you start setting up software for your home – be it home automation, a NAS system or something else – you’ll end up having a few different dashboards for control, that are all kind of ugly anyway. That’s where Mission Control comes in. It is a beatutiful and easy-to-configure dashboard system for your home!

Focus on

building widgets and connecting your APIs and services
and let Mission Control handle

User Management
Role-based permissions
HTTP & WebSocket transports 

## Features

- Real-time state sync between server and client (service-based API)
- Plugin API for creating your own services
- Role-based permission API
- Built-in User Management
- HTTP & WebSocket Transports
- Usecases:
	- Home Automation UIs / dashboards
	- Analytics dashboard combining different data sources
- Available plugins for:
	- HomeKit light control
	- Spotify player
	- YouTube downloader (youtube-dl integration)
	- Filebrowser
	- etc.
- Kinda pretty UI (at least I like it... you decide or build your own!)

## Installation

Note: 2.0.0 is currently in pre-release but more stable than 0.x.x versions.

```sh
$ npm install -g @capevace/mission-control@next
```

## Usage

You can now start the server like you would any binary.

```sh
$ mission-control --version
v2.0.0-rc8
```

### Options

```
Usage: mission-control [options]

Options:
  -V, --version       output the version number
  -u, --url <url>     the url mission control is reachable at
  -p, --port <port>   the port to use for mission control
  -h, --help          display help for command
```

### Config

A config file for mission-control will be created at `$HOME_DIR/.mission-control/config`. This can also be used to configure mission-control. However, options passed as command line arguments override settings in this file.

## Screenshots

![Mission Control Screenshot](resources/screenshot-2.0.0-rc6.png "Mission Control Screenshot")

## Changelog

### Version 2.0.0 (pre-release)

- Completely redesigned dashboard UI
- Introduction of a flexible plugin system
- Authentication is now handled by Mission Control itself, [single-sign-on](https://github.com/capevace/single-sign-on) is no longer required
- Users now have profiles, which will be integrated with a solid permission system
- Tons of bug fixes

### Version 0.5.4

- Rewrote logging system

### Version 0.5.3

- Added COVID widget to dashboard

### Version 0.5.2

- Fixed bahn algorithm skipping not displaying trains with SEV present

### Version 0.5.1

- Fixed dashboard layout now being loaded from database correctly

### Version 0.5.0

- New Dashboard is now customizeable

### Version 0.4.2

- Fixes error preventing the auth proxy from returning properly

### Version 0.4.1

- Fixes some minor security issues with dependencies

### Version 0.4.0

- The SSO server is now being proxied by default. This can be disabled with the `--no-proxy` option or by disabling it in the config file.
- Instead of localhost, the default url is now the local ip

## FAQ

### Running Mission Control on port 80

On Linux, running an http server on port 80 requires root priviliges. Generally this isn't a problem as you can simply `sudo mission-control -p 80` which works, but this approach falls apart when using systemd.

I found this workaround which seems to be the safest option to use instead:

```sh
sudo apt-get install libcap2-bin
sudo setcap 'cap_net_bind_service=+ep' /usr/bin/node # Replace path to node binary
```

## Authors

Lukas Mateffy – [@Capevace](https://twitter.com/capevace) – [mateffy.me](https://mateffy.me)

Distributed under the MIT license. See `LICENSE` for more information.

## Contributing

1. Fork it (<https://github.com/capevace/mission-control/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request
