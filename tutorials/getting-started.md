# Getting started with Mission Control

## Meet Mission Control

Mission Control is a Node.js framework for building real-time dashboards. It provides a strong foundation for building web-based dashboards that synchronize data in real-time.

It provides the most common features out-of-the-box so you can focus on the contents of your dashboard, instead of having to build all the boilerplate stuff yourself.

- Real-time state synchronization using services
- User Management
- Role-based permissions
- HTTP & WebSocket API
- Ready-to-use default UI

While Mission Control is flexible and easy to extend for more complex projects, it is also ready-to-go right after installation, which makes it perfect for small and quickly built dashboards.

If you want to know more about how Mission Control works, here's a section about [Concepts](concepts.md).

## Prerequisites
- Node >= v10.0.0
- NPM >=

## Installation

Installing Mission Control is very simple and works the same on any platform (though it is primarily tested on macOS).

```sh
npm i -g @capevace/mission-control
```

This will install the `mission-control` CLI. You're ready to go!


## Creating your first Mission Control project

Mission Control provides two ways to use out-of-the-box, and is otherwise customizable to your needs.

### Small Dashboards

When Mission Control is first started, it will generate a `.mission-control` folder in your home directory ([unless](cli.md#disable-init)). This folder contains a base configuration file, an SQLite database file and a folder for your custom plugins.
