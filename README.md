# petfeeder-web-vue

Web interface (for using in your intranet) for DIY pet feeder.
This is part of alternative software for DIY pet feeder, based on modified smart pet feeder _Petwant PF-103_.
Please check this links for more information:

https://github.com/yuriizubkov/petwant-device - npm module for communication with _Petwant PF-103_ microcontroller board. <br/>
https://github.com/yuriizubkov/petwant-device/wiki - useful information about modifying your _Petwant PF-103_.<br/>
https://github.com/yuriizubkov/petfeeder-backend - pet feeder server software.

Usually you don't need to install this app manually. Server software comes with this UI application preinstalled.

## Disclaimer

Here is no security measures whatsoever (no traffic encryption, authentication and authorization), use it on your own risk.
_Consider this version 1.0.0 as proof-of-concept or as a beta version._

## Main features

- Responsive interface with Vuetify and Vue.js
- Realtime communication with server over [socket.io](https://socket.io/) and [JSON-RPC 2.0](https://www.jsonrpc.org/specification) implementation.
- Ability to watch camera stream in built-in player. Thanks to [Broadway](https://www.npmjs.com/package/broadway-player) h264 decoding.
- Ability to take photo.
- Ability to feed your pet in "manual" mode.
- Ability to view and edit feeding schedule.
- Ability to see user-friendly event list by date (for example feeding event, clock sync or warning about no more food left in hopper. More detailed logs can be found on the server).
- Download and delete recorded videos from gallery (download, obviously, does not work on iOS, you still can watch videos from the gallery, but can't save it on your iOS device, because of iOS restrictions).

### Install dependencies

```
npm install
```

Inside folder with this repository.

### Compiles and minifies for production

```
npm run build
```

This command above will compile app to _/dist_ folder.

### Customize configuration for server

You can edit connection settings in _settings.json_.
You don't need that if you will be using this app with default server port. Server software comes with this UI application preinstalled.

### Author of the main page`s background image

https://pixabay.com/vectors/dog-cat-animal-pet-cute-1517090/
Thank you!
