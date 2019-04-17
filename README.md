# HAL6900 Mission Control

The mission control system for HAL6900.

## About

The mission control system is the heart of HAL6900. It carries the state for the home automation. Think of it as a master database for the whole IoT system.

It consists of a http server, a Socket.io instance, and the state machine.
The state machine represents the single source of truth, while the http server and socket instance are used for communication with HAL6900's other subsystems.
