import Vue from 'vue'
import Vuex from 'vuex'
import io from 'socket.io-client'
let settings = {}
if (process.env.NODE_ENV !== 'development') {
  settings = require('../../public/settings.json')
} else {
  settings = require('../../settings_development.json')
}

const RPC_TIMEOUT = 10000

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    title: 'Smart Pet Feeder',
    connected: false,
    connectionStateString: 'Connecting...',
    eventList: [],
    galleryList: [],
    galleryDates: {},
    eventDates: {},
    schedule: [],
    rpcRequestInProgress: false,
    snackbar: {
      snackbar: false,
      text: '',
      timeout: 3000,
    },
  },
  mutations: {
    setConnectionState(state, isConnected) {
      state.connected = isConnected
    },
    setConnectionStateStr(state, str) {
      state.connectionStateString = str
    },
    rpcRequestInProgress(state, isInProgress) {
      state.rpcRequestInProgress = isInProgress
    },
    setSchedule(state, schedule) {
      state.schedule = schedule
    },
    setEvents(state, events) {
      state.eventList = events
    },
    setGallery(state, gallery) {
      state.galleryList = gallery
    },
    setSnackbar(state, config) {
      state.snackbar = config
    },
    setTitle(state, title) {
      state.title = title
    },
    setGalleryDates(state, dates) {
      state.galleryDates = dates
    },
    setEventDates(state, dates) {
      state.eventDates = dates
    },
  },
  actions: {
    getSchedule(context) {
      return context
        .dispatch('rpc', {
          event: 'rpc/device/getSchedule',
        })
        .then(schedule => {
          context.commit('setSchedule', schedule)
        }) // Returns Promise, so we can handle .catch in desired Vue component in order to show error message
    },
    getEvents(context, date) {
      return context
        .dispatch('rpc', {
          event: 'rpc/database/getEvents',
          args: [date.year, date.month, date.date],
        })
        .then(events => {
          context.commit('setEvents', events)
          return events
        })
    },
    getGallery(context, date) {
      return context
        .dispatch('rpc', {
          event: 'rpc/database/getGallery',
          args: [date.year, date.month, date.date],
        })
        .then(events => {
          context.commit('setGallery', events)
          return events
        })
    },
    getGalleryDates(context) {
      return context
        .dispatch('rpc', {
          event: 'rpc/database/getGalleryDates',
        })
        .then(dates => {
          context.commit('setGalleryDates', dates)
          return dates
        })
    },
    getEventDates(context) {
      return context
        .dispatch('rpc', {
          event: 'rpc/database/getEventDates',
        })
        .then(dates => {
          context.commit('setEventDates', dates)
          return dates
        })
    },
    setScheduleEntry(context, scheduleEntry) {
      return context.dispatch('rpc', {
        event: 'rpc/device/setScheduleEntry',
        args: [
          // we need to pass this arguments in particular order (see petwant-device setScheduleEntry method)
          scheduleEntry.hours,
          scheduleEntry.minutes,
          scheduleEntry.portions,
          scheduleEntry.entryIndex,
          scheduleEntry.soundIndex,
          scheduleEntry.enabled,
        ],
      })
    },
    feedManually(context) {
      return context.dispatch('rpc', {
        event: 'rpc/device/feedManually',
      })
    },
    startVideo(context) {
      return context.dispatch('rpc', {
        event: 'rpc/camera/startVideoStream',
      })
    },
    stopVideo(context) {
      return context.dispatch('rpc', {
        event: 'rpc/camera/stopVideoStream',
      })
    },
    takePicture(context) {
      return context.dispatch('rpc', {
        event: 'rpc/camera/takePicture',
      })
    },
    rpc(context, rpcConfig) {
      rpcConfig.args = rpcConfig.args || []
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          // unsubscribing of whatever/rpc/call/response
          console.error(`RPC "${rpcConfig.event}" timeout`)
          socket.off(rpcConfig.event + '/response')
          context.commit('rpcRequestInProgress', false)
          reject('Remote procedure call timeout')
        }, RPC_TIMEOUT)

        // subscribing to "whatever/rpc/call/response"
        socket.once(rpcConfig.event + '/response', response => {
          clearTimeout(timeout) // clearing timeout first
          context.commit('rpcRequestInProgress', false)
          console.info(`RPC "${rpcConfig.event}" response:`, response)
          if (response && response.error) return reject(response.error)
          resolve(response)
        })

        context.commit('rpcRequestInProgress', true)
        // sending RPC request
        console.info(`RPC "${rpcConfig.event}" request:`, ...rpcConfig.args)
        socket.emit(rpcConfig.event, ...rpcConfig.args) // passing args in arguments
      })
    },
    showSnackbar(context, message) {
      // overriding defaults
      const config = Object.assign(
        {
          snackbar: true,
          text: 'Message text',
          timeout: 5000,
        },
        message
      )

      context.commit('setSnackbar', config)
    },
  },
  modules: {},
})

const socket = io(`http://${process.env.NODE_ENV === 'development' ? settings.ip : ''}:${settings.port}`, {
  path: settings.path,
  transports: ['websocket'],
})

socket.on('connect', () => {
  store.commit('setConnectionState', true)
  store.commit('setConnectionStateStr', 'Connected')
  console.info('Connection state:', 'Connected')
})

socket.on('disconnect', () => {
  store.commit('setConnectionState', false)
  store.commit('rpcRequestInProgress', false)
  store.commit('setConnectionStateStr', 'Disconnected')
  console.info('Connection state:', 'Disconnected')
})

socket.on('reconnecting', n => {
  store.commit('setConnectionState', false)
  store.commit('rpcRequestInProgress', false)
  store.commit('setConnectionStateStr', `Trying to reconnect (${n})`)
  console.info('Connection state:', 'Reconnecting...', n)
})

socket.on('reconnect_failed', () => {
  store.commit('setConnectionState', false)
  store.commit('rpcRequestInProgress', false)
  store.commit('setConnectionStateStr', `Reconnection failed`)
  console.error('Connection state:', 'Reconnection failed')
})

socket.on('connect_error', err => {
  store.commit('setConnectionState', false)
  store.commit('rpcRequestInProgress', false)
  store.commit('setConnectionStateStr', `Connection error: ${err.message}`)
  console.error('Connection error:', err)
})

/* Global events */
socket.on('event/device/feedingstarted', data => {
  console.info('Event "event/device/feedingstarted"', data)
  store.dispatch('showSnackbar', {
    text: 'Feeding has started',
    timeout: 3000,
  })
})

socket.on('event/device/warningnofood', () => {
  console.warn('Event "event/device/warningnofood"')
  store.dispatch('showSnackbar', {
    text: 'No food left. Please add more!',
    timeout: 10000,
  })
})

socket.on('event/device/feedingcomplete', data => {
  console.info('Event "event/device/feedingcomplete"', data)
  store.dispatch('showSnackbar', {
    text: `Feeding complete, portions issued: ${data}`,
  })
})

socket.on('event/device/clocksynchronized', () => {
  console.info('Event "event/device/clocksynchronized"')
  store.dispatch('showSnackbar', {
    text: 'Device clock has been synchronized',
  })
})

store.socket = socket

export default store
